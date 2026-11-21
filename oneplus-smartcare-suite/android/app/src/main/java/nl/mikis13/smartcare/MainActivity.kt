package nl.mikis13.smartcare

import android.app.Activity
import android.os.Bundle
import android.content.Intent
import android.net.Uri
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import java.security.SecureRandom

class MainActivity : Activity() {
    private lateinit var status: TextView
    private var selected: Uri? = null
    private val pickSource = 10
    private val createEncrypted = 11
    private val pickEncrypted = 12
    private val createDecrypted = 13
    private var pendingMode = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 32, 28, 24)
        }
        val title = TextView(this).apply {
            text = "OnePlus SmartCare Security Suite\nNord 5 • lokale beveiliging"
            textSize = 22f
        }
        status = TextView(this).apply {
            text = "Kies zelf een bestand. SmartCare leest alleen bestanden die je selecteert."
            textSize = 15f
            setPadding(0, 24, 0, 24)
        }
        root.addView(title)
        root.addView(status)
        root.addView(action("Bestand kiezen en SHA-256 controleren") { openPicker(pickSource) })
        root.addView(action("Geselecteerd bestand versleutelen (AES-256-GCM)") {
            if (selected == null) status.text = "Kies eerst een bronbestand."
            else {
                pendingMode = "encrypt"
                createDocument(createEncrypted, "application/octet-stream", "smartcare-encrypted.bin")
            }
        })
        root.addView(action("Versleuteld bestand ontsleutelen") {
            pendingMode = "decrypt"
            openPicker(pickEncrypted)
        })
        root.addView(action("Over SmartCare") {
            status.text = "MVP 0.1.0 • SHA-256 • AES-256-GCM • Android Keystore.\nGeen internettoegang, geen brede opslagrechten, geen automatische wijzigingen."
        })
        val scroll = ScrollView(this).apply { addView(root) }
        setContentView(scroll)
    }

    private fun action(label: String, run: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        gravity = Gravity.CENTER
        setOnClickListener { run() }
    }

    private fun openPicker(request: Int) {
        val i = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }
        startActivityForResult(i, request)
    }

    private fun createDocument(request: Int, mime: String, name: String) {
        val i = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mime
            putExtra(Intent.EXTRA_TITLE, name)
        }
        startActivityForResult(i, request)
    }

    @Deprecated("Activity result API kept dependency-free for MVP")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        try {
            when (requestCode) {
                pickSource -> {
                    selected = uri
                    status.text = "SHA-256: ${sha256(uri)}\nBronbestand geselecteerd. Origineel blijft ongewijzigd."
                }
                createEncrypted -> encryptFile(selected ?: return, uri)
                pickEncrypted -> {
                    selected = uri
                    status.text = "Versleuteld bestand gekozen. Selecteer nu een nieuwe uitvoerlocatie."
                    createDocument(createDecrypted, "application/octet-stream", "smartcare-decrypted.bin")
                }
                createDecrypted -> decryptFile(selected ?: return, uri)
            }
        } catch (e: Exception) {
            status.text = "Actie mislukt: ${e.javaClass.simpleName}: ${e.message ?: "onbekende fout"}"
        }
    }

    private fun sha256(uri: Uri): String {
        val digest = MessageDigest.getInstance("SHA-256")
        contentResolver.openInputStream(uri).use { input ->
            requireNotNull(input) { "Bestand kan niet worden gelezen" }.buffered().use { stream ->
                val buffer = ByteArray(64 * 1024)
                while (true) {
                    val n = stream.read(buffer)
                    if (n < 0) break
                    digest.update(buffer, 0, n)
                }
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun getOrCreateKey(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return generator.generateKey()
    }

    private fun encryptFile(source: Uri, destination: Uri) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val iv = cipher.iv
        require(iv.size == 12) { "Onverwachte GCM nonce-lengte" }
        contentResolver.openInputStream(source).use { rawIn ->
            contentResolver.openOutputStream(destination, "w").use { rawOut ->
                requireNotNull(rawIn); requireNotNull(rawOut)
                rawOut.write(MAGIC)
                rawOut.write(iv)
                CipherOutputStream(BufferedOutputStream(rawOut), cipher).use { encrypted ->
                    BufferedInputStream(rawIn).use { input -> input.copyTo(encrypted) }
                }
            }
        }
        status.text = "Versleuteling voltooid. AES-256-GCM; apart uitvoerbestand gemaakt. Bewaar dit toestel/app en de originele installatie: de sleutel staat in Android Keystore."
    }

    private fun decryptFile(source: Uri, destination: Uri) {
        contentResolver.openInputStream(source).use { rawIn ->
            requireNotNull(rawIn)
            val input = BufferedInputStream(rawIn)
            val magic = ByteArray(MAGIC.size)
            require(input.read(magic) == magic.size && magic.contentEquals(MAGIC)) {
                "Geen SmartCare-versleuteld bestand"
            }
            val iv = ByteArray(12)
            var offset = 0
            while (offset < iv.size) {
                val n = input.read(iv, offset, iv.size - offset)
                require(n > 0) { "Onvolledig versleuteld bestand" }
                offset += n
            }
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, iv))
            contentResolver.openOutputStream(destination, "w").use { rawOut ->
                requireNotNull(rawOut)
                CipherInputStream(input, cipher).use { decrypted ->
                    BufferedOutputStream(rawOut).use { out -> decrypted.copyTo(out) }
                }
            }
        }
        status.text = "Ontsleuteling voltooid. Authenticatie via GCM is geslaagd."
    }

    companion object {
        private const val KEY_ALIAS = "oneplus-smartcare-aes-gcm-v1"
        private val MAGIC = byteArrayOf(0x53, 0x43, 0x41, 0x52, 0x45, 0x30, 0x31)
    }
}
