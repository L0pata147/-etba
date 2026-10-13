package cz.maturita.trener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Spustí se v naplánovaný čas: zobrazí připomínku a naplánuje další na zítra. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        Reminders.schedule(ctx);
        // připomínka může načítat kamarády ze sítě – mimo hlavní vlákno
        final PendingResult result = goAsync();
        final Context app = ctx.getApplicationContext();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Reminders.showReminder(app, false);
                } finally {
                    result.finish();
                }
            }
        }).start();
    }
}
