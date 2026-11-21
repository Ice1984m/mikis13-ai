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
import android.widget.Toast
import java.io.File
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class MainActivity : Activity() {
    private lateinit var status: TextView
    private var selectedUri: Uri? = null
    private var selectedName = "selected-file"
    private var pendingDecrypted: ByteArray? = null
    private val pickRequest = 4101
    private val saveRequest = 4102
    private val maxBytes = 25L * 1024L * 1024L
    private val keyAlias = "oneplus-smartcare-aes-gcm-v1"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val column = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 32, 28, 28)
        }
        val scroll = ScrollView(this)
        column.addView(TextView(this).apply {
            text = "OnePlus SmartCare Security Suite\n\nLokale bestandsbeveiliging"
            textSize = 23f
        })
        status = TextView(this).apply {
            text = "Kies zelf een bestand. Het origineel blijft ongewijzigd."
            textSize = 15f
            setPadding(0, 24, 0, 24)
        }
        column.addView(status)
        column.addView(makeButton("Bestand kiezen") { chooseFile() })
        column.addView(makeButton("SHA-256 berekenen") { calculateHash() })
        column.addView(makeButton("Versleutelde kopie maken") { encryptCopy() })
        column.addView(makeButton("Versleutelde kopie herstellen") { decryptCopy() })
        column.addView(TextView(this).apply {
            text = "\nPrivacy: geen netwerktoegang, geen automatische scans en geen verwijderacties. Versleutelde kopieën worden in de privé-opslag van deze app bewaard."
            textSize = 13f
        })
        scroll.addView(column)
        setContentView(scroll)
    }

    private fun makeButton(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        gravity = Gravity.CENTER
        setOnClickListener { action() }
    }

    private fun chooseFile() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }
        startActivityForResult(intent, pickRequest)
    }

    @Deprecated("Legacy callback used for compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == pickRequest && resultCode == RESULT_OK) {
            val uri = data?.data ?: return
            selectedUri = uri
            selectedName = queryName(uri) ?: "selected-file"
            status.text = "Geselecteerd: $selectedName\\nBronbestand wordt alleen gelezen."
        } else if (requestCode == saveRequest && resultCode == RESULT_OK) {
            val uri = data?.data
            val plain = pendingDecrypted
            if (uri != null && plain != null) {
                contentResolver.openOutputStream(uri)?.use { it.write(plain) }
                    ?: error("Hersteld bestand kon niet worden opgeslagen.")
                pendingDecrypted = null
                status.text = "Herstel voltooid. Het herstelde bestand is opgeslagen."
            } else {
                pendingDecrypted = null
                status.text = "Opslaan geannuleerd. Er is niets gewijzigd."
            }
        }
    }

    private fun queryName(uri: Uri): String? {
        contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (index >= 0) return cursor.getString(index)
            }
        }
        return null
    }

    private fun readSelected(): ByteArray {
        val uri = selectedUri ?: error("Kies eerst een bestand.")
        return contentResolver.openInputStream(uri)?.use { input ->
            val output = java.io.ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            var total = 0L
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                total += count
                require(total <= maxBytes) { "Maximale bestandsgrootte in deze versie: 25 MB." }
                output.write(buffer, 0, count)
            }
            output.toByteArray()
        } ?: error("Bestand kon niet worden gelezen.")
    }

    private fun calculateHash() = safely {
        val hash = MessageDigest.getInstance("SHA-256").digest(readSelected())
            .joinToString("") { "%02x".format(it) }
        status.text = "SHA-256\n$hash\n\nIntegriteitscontrole, geen malwaretest."
    }

    private fun getOrCreateKey(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val found = store.getKey(keyAlias, null)
        if (found is SecretKey) return found
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(keyAlias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return generator.generateKey()
    }

    private fun encryptCopy() = safely {
        val plain = readSelected()
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val encrypted = cipher.doFinal(plain)
        val iv = cipher.iv
        val directory = File(filesDir, "encrypted").apply { mkdirs() }
        val safeName = selectedName.replace(Regex("[^A-Za-z0-9._-]"), "_").take(80)
        val output = File(directory, "$safeName.${System.currentTimeMillis()}.scs.enc")
        output.outputStream().use { stream ->
            stream.write(byteArrayOf(0x53, 0x43, 0x53, 0x31))
            stream.write(iv.size)
            stream.write(iv)
            stream.write(encrypted)
        }
        status.text = "Versleutelde kopie aangemaakt in privé-opslag:\n${output.name}\n\nOrigineel niet gewijzigd. Bewaar een reservekopie. De Keystore-sleutel is niet exporteerbaar."
    }

    private fun decryptCopy() = safely {
        val container = readSelected()
        require(container.size > 17) { "Dit bestand is te klein voor SmartCare-versleuteling." }
        require(container.copyOfRange(0, 4).contentEquals(byteArrayOf(0x53, 0x43, 0x53, 0x31))) {
            "Bestandsformaat niet herkend. Kies een .scs.enc-bestand van SmartCare."
        }
        val ivLength = container[4].toInt() and 0xff
        require(ivLength == 12 && container.size > 5 + ivLength) { "Ongeldige versleutelingsheader." }
        val iv = container.copyOfRange(5, 5 + ivLength)
        val ciphertext = container.copyOfRange(5 + ivLength, container.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), javax.crypto.spec.GCMParameterSpec(128, iv))
        pendingDecrypted = cipher.doFinal(ciphertext)
        val title = selectedName.removeSuffix(".scs.enc").take(70) + ".restored"
        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/octet-stream"
            putExtra(Intent.EXTRA_TITLE, title)
        }
        status.text = "Bestand ontsleuteld. Kies nu een locatie om de herstelde kopie op te slaan."
        startActivityForResult(intent, saveRequest)
    }

    private fun safely(action: () -> Unit) {
        try {
            action()
        } catch (error: Exception) {
            val message = error.message ?: error.javaClass.simpleName
            status.text = "Actie niet voltooid: $message"
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        }
    }
}
