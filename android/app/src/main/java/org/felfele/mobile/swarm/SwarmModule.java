package org.felfele.mobile;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.LifecycleEventListener;
import mobileswarm.Mobileswarm;
import android.content.ContextWrapper;
import org.json.JSONObject;

import java.util.Map;
import java.util.HashMap;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

public class SwarmModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private ReactApplicationContext reactContext;
    public SwarmModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return "Swarm";
    }

    @ReactMethod
    public void start() {
        this.startNode();
    }

    private void log(String msg) {
        System.out.println("Swarm: " + msg);
    }

    private void startNode() {
        final String appPath = this.reactContext.getFilesDir().getAbsolutePath();
        this.log("startNode, path: " + appPath);
        final String bootnodeURL = "enode://4c113504601930bf2000c29bcd98d1716b6167749f58bad703bae338332fe93cc9d9204f08afb44100dc7bea479205f5d162df579f9a8f76f8b402d339709023@3.122.203.99:30301";
        final String loglevel = "debug";
        final String result = Mobileswarm.startNode(appPath, ":0", bootnodeURL, loglevel);
        this.log("startNode result: " + result);
    }

    @Override
    public void onHostResume() {
        this.log("resume application");
        this.startNode();
    }

    @Override
    public void onHostPause() {
        this.log("pause application");
        this.log(Mobileswarm.stopNode());
    }

    @Override
    public void onHostDestroy() {
        this.log("destroy application");
        this.log(Mobileswarm.stopNode());
    }
}
