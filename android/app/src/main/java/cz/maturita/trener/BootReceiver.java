package cz.maturita.trener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Po restartu telefonu (nebo aktualizaci aplikace) obnoví naplánovanou připomínku. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        Reminders.schedule(ctx);
    }
}
