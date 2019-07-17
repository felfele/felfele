package org.felfele.mobile;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.avishayil.rnrestart.ReactNativeRestartPackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.horcrux.svg.SvgPackage;
import net.rhogan.rnsecurerandom.RNSecureRandomPackage;
import com.rnfs.RNFSPackage;
import org.reactnative.camera.RNCameraPackage;
import com.imagepicker.ImagePickerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.rngrp.RNGRPPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new AsyncStoragePackage(),
            new RNBackgroundFetchPackage(),
            new ReactNativePushNotificationPackage(),
            new RNDeviceInfo(),
            new SplashScreenReactPackage(),
            new ReactNativeRestartPackage(),
            new ImageResizerPackage(),
            new SvgPackage(),
            new RNSecureRandomPackage(),
            new RNFSPackage(),
            new RNCameraPackage(),
            new ImagePickerPackage(),
            new VectorIconsPackage(),
            new RNGRPPackage(),
            new SwarmPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
