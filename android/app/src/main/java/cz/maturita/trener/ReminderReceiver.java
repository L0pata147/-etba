package cz.maturita.trener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Spustí se v naplánovaný čas: zobrazí připomínku a naplánuje další na zítra. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        Reminders.showReminder(ctx, false);
        Reminders.schedule(ctx);
    }
}
