import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { RepeatWrapping, FrontSide } from "three/src/constants";
import { Loader } from '../utils/Assets';

export default class extends MeshStandardMaterial
{
    /** @param {import("three").MeshStandardMaterialParameters} parameters @param {import("three").Vector2 | undefined} repeat */
    constructor(parameters, repeat)
    {
        super(parameters);

        Loader.loadTexture("asphalt.jpg").then((asphalt) =>
        {
            repeat && asphalt.repeat.copy(repeat);
            asphalt.wrapS = asphalt.wrapT = RepeatWrapping;
            this.setValues({ ...parameters, map: asphalt, side: FrontSide });
        });
    }

    dispose()
    {
        this.displacementMap?.dispose();
        this.metalnessMap?.dispose();
        this.roughnessMap?.dispose();

        this.emissiveMap?.dispose();
        this.gradientMap?.dispose();
        this.specularMap?.dispose();

        this.normalMap?.dispose();
        this.alphaMap?.dispose();
        this.lightMap?.dispose();

        this.bumpMap?.dispose();
        this.envMap?.dispose();
        this.aoMap?.dispose();
        this.map?.dispose();

        super.dispose();
    }
}
