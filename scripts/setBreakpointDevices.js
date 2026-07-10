cat > /tmp/update_chrome_devices.mjs << 'EOF'
import fs from 'fs';
import path from 'path';

const prefPath = path.join(process.env.HOME, '.config/google-chrome/Default/Preferences');

try {
    const fileContent = fs.readFileSync(prefPath, 'utf8');
    const prefs = JSON.parse(fileContent);

    if (!prefs.devtools) prefs.devtools = {};
    if (!prefs.devtools.preferences) prefs.devtools.preferences = {};

    let deviceListStr = prefs.devtools.preferences['custom-emulated-device-list'] || '[]';
    let devices = JSON.parse(deviceListStr);

    // The exact devices we want to enforce
    const canonicalDevices = [
        {
            title: "1-xs", type: "unknown", "user-agent": "",
            capabilities: ["mobile", "touch"],
            screen: { "device-pixel-ratio": 1, vertical: { width: 360, height: 700 }, horizontal: { width: 700, height: 360 } },
            modes: [{ title: "", orientation: "vertical", insets: { left: 0, top: 0, right: 0, bottom: 0 } }, { title: "", orientation: "horizontal", insets: { left: 0, top: 0, right: 0, bottom: 0 } }],
            "show-by-default": true, "dual-screen": false, "foldable-screen": false, show: "Default",
            "user-agent-metadata": { brands: [{ brand: "", version: "" }], fullVersionList: [{ brand: "", version: "" }], fullVersion: "", platform: "", platformVersion: "", architecture: "", model: "", mobile: true, formFactors: [] }
        },
        {
            title: "2-sm", type: "unknown", "user-agent": "",
            capabilities: ["mobile", "touch"],
            screen: { "device-pixel-ratio": 1, vertical: { width: 640, height: 1136 }, horizontal: { width: 1136, height: 640 } },
            modes: [{ title: "", orientation: "vertical", insets: { left: 0, top: 0, right: 0, bottom: 0 } }, { title: "", orientation: "horizontal", insets: { left: 0, top: 0, right: 0, bottom: 0 } }],
            "show-by-default": true, "dual-screen": false, "foldable-screen": false, show: "Default",
            "user-agent-metadata": { brands: [{ brand: "", version: "" }], fullVersionList: [{ brand: "", version: "" }], fullVersion: "", platform: "", platformVersion: "", architecture: "", model: "", mobile: true, formFactors: [] }
        },
        {
            title: "3-md", type: "unknown", "user-agent": "",
            capabilities: ["mobile", "touch"],
            screen: { "device-pixel-ratio": 1, vertical: { width: 768, height: 1024 }, horizontal: { width: 1024, height: 768 } },
            modes: [{ title: "", orientation: "vertical", insets: { left: 0, top: 0, right: 0, bottom: 0 } }, { title: "", orientation: "horizontal", insets: { left: 0, top: 0, right: 0, bottom: 0 } }],
            "show-by-default": true, "dual-screen": false, "foldable-screen": false, show: "Default",
            "user-agent-metadata": { brands: [{ brand: "", version: "" }], fullVersionList: [{ brand: "", version: "" }], fullVersion: "", platform: "", platformVersion: "", architecture: "", model: "", mobile: true, formFactors: [] }
        },
        {
            title: "4-lg", type: "unknown", "user-agent": "",
            capabilities: ["touch"],
            screen: { "device-pixel-ratio": 1, vertical: { width: 1024, height: 768 }, horizontal: { width: 768, height: 1024 } },
            modes: [{ title: "", orientation: "vertical", insets: { left: 0, top: 0, right: 0, bottom: 0 } }, { title: "", orientation: "horizontal", insets: { left: 0, top: 0, right: 0, bottom: 0 } }],
            "show-by-default": true, "dual-screen": false, "foldable-screen": false, show: "Default",
            "user-agent-metadata": { brands: [{ brand: "", version: "" }], fullVersionList: [{ brand: "", version: "" }], fullVersion: "", platform: "", platformVersion: "", architecture: "", model: "", mobile: false, formFactors: [] }
        },
        {
            title: "5-xl", type: "unknown", "user-agent": "",
            capabilities: [],
            screen: { "device-pixel-ratio": 1, vertical: { width: 1280, height: 800 }, horizontal: { width: 800, height: 1280 } },
            modes: [{ title: "", orientation: "vertical", insets: { left: 0, top: 0, right: 0, bottom: 0 } }, { title: "", orientation: "horizontal", insets: { left: 0, top: 0, right: 0, bottom: 0 } }],
            "show-by-default": true, "dual-screen": false, "foldable-screen": false, show: "Default",
            "user-agent-metadata": { brands: [{ brand: "", version: "" }], fullVersionList: [{ brand: "", version: "" }], fullVersion: "", platform: "", platformVersion: "", architecture: "", model: "", mobile: false, formFactors: [] }
        },
        {
            title: "6-xxl", type: "unknown", "user-agent": "",
            capabilities: [],
            screen: { "device-pixel-ratio": 1, vertical: { width: 1536, height: 864 }, horizontal: { width: 864, height: 1536 } },
            modes: [{ title: "", orientation: "vertical", insets: { left: 0, top: 0, right: 0, bottom: 0 } }, { title: "", orientation: "horizontal", insets: { left: 0, top: 0, right: 0, bottom: 0 } }],
            "show-by-default": true, "dual-screen": false, "foldable-screen": false, show: "Default",
            "user-agent-metadata": { brands: [{ brand: "", version: "" }], fullVersionList: [{ brand: "", version: "" }], fullVersion: "", platform: "", platformVersion: "", architecture: "", model: "", mobile: false, formFactors: [] }
        }
    ];

    const canonicalTitles = new Set(canonicalDevices.map(d => d.title));

    // IDEMPOTENCY LOGIC: 
    // 1. Filter out any existing devices that match our target titles (removes old/modified versions)
    // 2. Concatenate the user's other custom devices with our pristine canonical list
    const finalDevices = [
        ...devices.filter(d => !canonicalTitles.has(d.title)),
        ...canonicalDevices
    ];

    // Save back to Chrome's exact expected format
    prefs.devtools.preferences['custom-emulated-device-list'] = JSON.stringify(finalDevices);
    fs.writeFileSync(prefPath, JSON.stringify(prefs, null, 3));

    console.log(`✅ Success! Device list synchronized. 6 canonical breakpoints enforced.`);

} catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
}
EOF
node / tmp / update_chrome_devices.mjs
