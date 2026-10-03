package cz.maturita.trener;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/** Plánování a zobrazení denní připomínky. Vše běží v telefonu, bez serveru. */
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

        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("route", "/");
        PendingIntent pi = PendingIntent.getActivity(ctx, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        ensureChannel(ctx);
        Notification n = new Notification.Builder(ctx, CHANNEL)
                .setSmallIcon(notificationIcon(ctx))
                .setColor(0xFF1D4ED8)
                .setContentTitle(title)
                .setContentText(text.toString())
                .setStyle(new Notification.BigTextStyle().bigText(text.toString()))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build();
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(NOTIFICATION_ID, n);
    }
}
