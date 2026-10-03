import com.reandroid.apk.ApkModule;
import com.reandroid.apk.ApkModuleXmlEncoder;
import java.io.File;

/** Zakóduje adresář (manifest + res + root) do nepodepsaného APK pomocí ARSCLib */
public class BuildApk {
    public static void main(String[] args) throws Exception {
        ApkModuleXmlEncoder enc = new ApkModuleXmlEncoder();
        enc.setApkLogger(new com.reandroid.apk.APKLogger() {
            public void logMessage(String m) { System.out.println("[arsc] " + m); }
            public void logError(String m, Throwable t) { System.out.println("[arsc ERR] " + m + " " + t); }
            public void logVerbose(String m) {}
        });
        enc.scanDirectory(new File(args[0]));
        ApkModule m = enc.getApkModule();
        m.writeApk(new File(args[1]));
        System.out.println("OK " + args[1]);
    }
}
