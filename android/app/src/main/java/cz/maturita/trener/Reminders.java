package cz.maturita.trener;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/** Plánování a zobrazení denní připomínky. Volá se mimo hlavní vlákno (kvůli načtení kamarádů). */
final class Reminders {
    static final String CHANNEL = "reminders";
    static final String KEY_ENABLED = "enabled";
    static final String KEY_HOUR = "hour";
    static final String KEY_MINUTE = "minute";
    static final String KEY_STATUS = "status";
    private static final int NOTIFICATION_ID = 1001;

    private Reminders() {}

    /** ID ikonky upozornění (zdroje kóduje ARSCLib, proto se nepoužívá třída R) */
    private static int notificationIcon(Context ctx) {
        int id = ctx.getResources().getIdentifier("ic_notification", "drawable", ctx.getPackageName());
        return id != 0 ? id : android.R.drawable.ic_popup_reminder;
    }

    static void ensureChannel(Context ctx) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Připomínky učení", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Denní připomínka tréninku a odpočet do maturity");
        nm.createNotificationChannel(ch);
    }

    private static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        return PendingIntent.getBroadcast(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Naplánuje nejbližší připomínku (dnes, pokud čas ještě nenastal, jinak zítra) */
    static void schedule(Context ctx) {
        SharedPreferences p = MainActivity.prefs(ctx);
        if (!p.getBoolean(KEY_ENABLED, false)) return;
        int hour = p.getInt(KEY_HOUR, 18);
        int minute = p.getInt(KEY_MINUTE, 0);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next = now.toLocalDate().atTime(hour, minute);
        if (!next.isAfter(now.plusSeconds(30))) next = next.plusDays(1);
        long at = next.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, alarmIntent(ctx));
    }

    static void cancel(Context ctx) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmIntent(ctx));
    }

    /**
     * Zobrazí připomínku. Pokud se uživatel dnes už učil (a nejde o test ani o odpočet
     * do maturity), upozornění se nezobrazí – zbytečně neruší.
     */
    static void showReminder(Context ctx, boolean force) {
        JSONObject s;
        try {
            s = new JSONObject(MainActivity.prefs(ctx).getString(KEY_STATUS, "{}"));
        } catch (Exception e) {
            s = new JSONObject();
        }
        LocalDate today = LocalDate.now();
        boolean studiedToday = today.toString().equals(s.optString("lastStudyDay", ""));
        int streak = s.optInt("streak", 0);
        int due = s.optInt("due", 0);
        int minutes = s.optInt("minutes", 15);
        String rec = s.optString("rec", "");
        String qotd = s.optString("qotd", "");

        long examDays = -1;
        String exam = s.optString("examDate", "");
        if (!exam.isEmpty()) {
            try {
                examDays = ChronoUnit.DAYS.between(today, LocalDate.parse(exam));
            } catch (Exception ignored) {
            }
        }
        boolean examMilestone = examDays == 60 || examDays == 30 || examDays == 14 || (examDays >= 1 && examDays <= 7);

        if (studiedToday && !force && !examMilestone) return;

        String title;
        if (examMilestone) {
            title = "🎓 Do maturity " + (examDays == 1 ? "zbývá 1 den" : examDays <= 4 ? "zbývají " + examDays + " dny" : "zbývá " + examDays + " dní");
        } else if (studiedToday) {
            title = "✅ Dnes už máš splněno";
        } else if (streak > 0) {
            title = "🔥 Neztrať sérii " + streak + (streak == 1 ? " den" : streak <= 4 ? " dny" : " dní");
        } else {
            title = "📚 Čas na maturitní přípravu";
        }

        StringBuilder text = new StringBuilder();
        if (studiedToday) {
            text.append("Skvělá práce. Klidně si dej ještě krátké opakování.");
        } else {
            text.append("Dnes doporučeno: ").append(rec.isEmpty() ? "dnešní trénink" : rec).append(" · ").append(minutes).append(" min");
        }
        if (due > 0) text.append(" · ").append(due).append(due == 1 ? " otázka čeká" : due <= 4 ? " otázky čekají" : " otázek čeká").append(" na zopakování");
        if (!studiedToday) {
            List<String> friends = friendsToday(s, today);
            if (!friends.isEmpty()) {
                text.append("\n👥 Dnes už se učí: ");
                int n = Math.min(3, friends.size());
                text.append(String.join(", ", friends.subList(0, n)));
                if (friends.size() > n) text.append(" a další ").append(friends.size() - n);
            }
        }
        text.append(contestsLine(s, today));
        String shortText = text.toString();
        if (!qotd.isEmpty()) text.append("\n\n❓ Otázka dne:\n").append(qotd).append("\n\nKlepni a odpověz.");

        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("route", qotd.isEmpty() ? "/" : "/otazka-dne");
        PendingIntent pi = PendingIntent.getActivity(ctx, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        ensureChannel(ctx);
        Notification n = new Notification.Builder(ctx, CHANNEL)
                .setSmallIcon(notificationIcon(ctx))
                .setColor(0xFF1D4ED8)
                .setContentTitle(title)
                .setContentText(qotd.isEmpty() ? shortText : "❓ Otázka dne – rozbal upozornění")
                .setStyle(new Notification.BigTextStyle().bigText(text.toString()))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build();
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(NOTIFICATION_ID, n);
    }

    /** POST na funkci serveru (Supabase RPC); null = bez připojení nebo chyba */
    private static String rpc(JSONObject g, String fn, JSONObject body) {
        HttpURLConnection c = null;
        try {
            URL url = new URL(g.getString("url").replaceAll("/$", "") + "/rest/v1/rpc/" + fn);
            c = (HttpURLConnection) url.openConnection();
            c.setConnectTimeout(5000);
            c.setReadTimeout(5000);
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            String key = g.getString("key");
            c.setRequestProperty("apikey", key);
            if (key.startsWith("eyJ")) c.setRequestProperty("Authorization", "Bearer " + key);
            c.setRequestProperty("Content-Type", "application/json");
            try (OutputStream os = c.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
            if (c.getResponseCode() != 200) return null;
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            try (InputStream in = c.getInputStream()) {
                byte[] b = new byte[4096];
                int r;
                while ((r = in.read(b)) > 0) buf.write(b, 0, r);
            }
            return buf.toString("UTF-8");
        } catch (Exception ignored) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private static JSONObject groupBody(JSONObject g) throws Exception {
        return new JSONObject().put("p_group", g.getString("code")).put("p_member", g.getString("member"));
    }

    /** Kamarádi ze skupiny, kteří se dnes učili – načte se ze serveru, jinak z posledního stavu aplikace */
    private static List<String> friendsToday(JSONObject s, LocalDate today) {
        List<String> out = new ArrayList<>();
        JSONObject g = s.optJSONObject("group");
        if (g != null) {
            try {
                String res = rpc(g, "group_list", groupBody(g));
                if (res != null) {
                    JSONArray rows = new JSONArray(res);
                    for (int i = 0; i < rows.length(); i++) {
                        JSONObject row = rows.getJSONObject(i);
                        JSONObject st = row.optJSONObject("stats");
                        if (row.optBoolean("me") || st == null) continue;
                        if (today.toString().equals(st.optString("lastActive")) && st.optInt("today", 0) > 0) out.add(row.optString("name"));
                    }
                    return out;
                }
            } catch (Exception ignored) {
                // bez připojení – použije se poslední stav z aplikace
            }
        }
        if (today.toString().equals(s.optString("friendsDay", ""))) {
            JSONArray f = s.optJSONArray("friends");
            if (f != null) for (int i = 0; i < f.length(); i++) out.add(f.optString(i));
        }
        return out;
    }

    /** Soutěže: čekající duely a kvíz dne skupiny (prázdné, když server soutěže nemá) */
    private static String contestsLine(JSONObject s, LocalDate today) {
        JSONObject g = s.optJSONObject("group");
        if (g == null) return "";
        try {
            String res = rpc(g, "contest_status", groupBody(g).put("p_day", today.toString()));
            if (res == null) return "";
            JSONObject st = new JSONObject(res);
            StringBuilder out = new StringBuilder();
            JSONArray waiting = st.optJSONArray("waiting");
            if (waiting != null && waiting.length() > 0) {
                List<String> names = new ArrayList<>();
                for (int i = 0; i < Math.min(3, waiting.length()); i++) names.add(waiting.optString(i));
                out.append("\n⚔️ Výzva na duel od: ").append(String.join(", ", names));
                if (waiting.length() > 3) out.append(" a další");
            }
            int daily = st.optInt("daily", 0);
            if (!st.optBoolean("played") && daily > 0) {
                out.append("\n🧠 Kvíz dne skupiny čeká (hráčů: ").append(daily).append(") – přidej se");
            }
            return out.toString();
        } catch (Exception ignored) {
            return "";
        }
    }
}
