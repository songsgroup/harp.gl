import {
    AtlasOptions,
    generateSprites,
    generateSpritesAtlas,
    ProcessingOptions
} from "@here/harp-atlas-tools/src";
import * as os from "os";
import * as path from "path";

// Allow to use console output, script runs in a shell (node), not in the browser.
// tslint:disable:no-console

// tslint:disable-next-line: no-var-requires
const tmp = require("tmp");

function downloadMakiIcons(targetDir: string): Promise<string> {
    const ghdownload = require("github-download");
    const makiPath: string = path.join(__dirname, "..");
    return new Promise((resolve, reject) => {
        ghdownload("https://github.com/mapbox/maki#master", targetDir)
            .on("error", (err: any) => {
                reject(new Error(err));
            })
            .on("end", () => {
                resolve(path.join(makiPath, targetDir));
            });
    });
}

async function generateMakiAtlas(
    makiDir: string,
    atlasPath: string,
    smallIconsConfig: string,
    bigIconsConfig: string
): Promise<any> {
    const cpus: number = os.cpus() ? os.cpus().length : 4;
    // Create temprorary directory for sprites output inside makiDir
    const tmpDir = tmp.dirSync({ template: 'sprites-XXXXXX', dir: makiDir });
    const spritesInputPath: string = path.join(makiDir, "icons");
    const spritesOutputPath: string = tmpDir.name;

    const spritesDaySmallOpt: ProcessingOptions = {
        input: path.join(spritesInputPath, "*-11.svg"),
        output: spritesOutputPath,
        width: 0,
        height: 0,
        verbose: false,
        jobs: cpus,
        processConfig: smallIconsConfig
    };

    // Generate maki -11 sprites (smaller size)
    let spritesList: string[] = await generateSprites(spritesDaySmallOpt);

    const spritesDayBigOpt: ProcessingOptions = {
        ...spritesDaySmallOpt,
        input: path.join(spritesInputPath, "*-15.svg"),
        processConfig: bigIconsConfig
    };

    // Generate maki -15 sprites (bigger size)
    spritesList = await generateSprites(spritesDayBigOpt);

    const atlasDayOpt: AtlasOptions = {
        input: path.join(spritesOutputPath, "*.png"),
        output: atlasPath,
        width: 0,
        height: 0,
        verbose: false,
        jobs: cpus,
        processConfig: "",
        padding: 1,
        minify: false
    };
    // Generate atlas from both sprites set
    return generateSpritesAtlas(atlasDayOpt);
}

async function prepareIcons() {

    const tmpDir = tmp.dirSync({ template: 'resources-tmp-XXXXXX', dir: ".", unsafeCleanup: true });
    try {
        // Download maki icons set from github
        const tempDir: string = tmpDir.name;
        await downloadMakiIcons(tempDir);

        // Create day mode icons atlas
        const atlasDay: string = "resources/maki_icons_day";
        const configDaySmall: string = "resources-dev/icons/configs/icons-day-maki-11.json";
        const configDayBig: string = "resources-dev/icons/configs/icons-day-maki-15.json";
        await generateMakiAtlas(tempDir, atlasDay, configDaySmall, configDayBig);

        // Create night mode icons atlas
        const atlasNight: string = "resources/maki_icons_night";
        const configNightSmall: string = "resources-dev/icons/configs/icons-night-maki-11.json";
        const configNightBig: string = "resources-dev/icons/configs/icons-night-maki-15.json";
        await generateMakiAtlas(tempDir, atlasNight, configNightSmall, configNightBig);
    } finally {
        // Manual cleanup
        tmpDir.removeCallback();
    }
}

prepareIcons()
    .then(() => {
        console.log("Assets prepare successful");
    })
    .catch(err => {
        console.error("Could not prepare assets! ", err);
    });