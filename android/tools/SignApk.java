import com.android.apksig.ApkSigner;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;

/** Podepíše APK (schémata v1–v3) klíčem z keystore pomocí apksig */
public class SignApk {
    public static void main(String[] a) throws Exception {
        // a: in out keystore alias password
        KeyStore ks = KeyStore.getInstance("JKS");
        try (FileInputStream in = new FileInputStream(a[2])) { ks.load(in, a[4].toCharArray()); }
        PrivateKey key = (PrivateKey) ks.getKey(a[3], a[4].toCharArray());
        X509Certificate cert = (X509Certificate) ks.getCertificate(a[3]);
        ApkSigner.SignerConfig cfg = new ApkSigner.SignerConfig.Builder("cert", key, Collections.singletonList(cert)).build();
        new ApkSigner.Builder(Collections.singletonList(cfg))
                .setInputApk(new File(a[0]))
                .setOutputApk(new File(a[1]))
                .setMinSdkVersion(26)
                .setV1SigningEnabled(false)
                .setV2SigningEnabled(true)
                .build()
                .sign();
        System.out.println("SIGNED " + a[1]);
    }
}
