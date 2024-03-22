import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";

export default class extends MeshStandardMaterial
{
    /** @param {import("three").MeshStandardMaterialParameters} parameters */
    constructor(parameters)
    {
        super(parameters);
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
