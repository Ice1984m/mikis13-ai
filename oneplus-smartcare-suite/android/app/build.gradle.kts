plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "nl.mikis13.smartcare"
    compileSdk = 35

    defaultConfig {
        applicationId = "nl.mikis13.smartcare"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
}
