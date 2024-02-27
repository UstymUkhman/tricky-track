import { MeshPhongMaterial } from "three/src/materials/MeshPhongMaterial";
import parsVert from "../shaders/ground/pars.vert";
import mainVert from "../shaders/ground/main.vert";
import parsFrag from "../shaders/ground/pars.frag";
import mainFrag from "../shaders/ground/main.frag";

export default class Ground extends MeshPhongMaterial
{
    /** @param {import("three").MeshPhongMaterialParameters} parameters */
    constructor(parameters)
    {
        super(parameters);
        this.setValues(parameters);
    }

    /** @param {import("three").ShaderLibShader} shader */
    #updateDefaultVertexShader(shader)
    {
        shader.vertexShader = `${parsVert}
        ${shader.vertexShader.replace(
            "void main() {",
            `void main() {
            ${mainVert}`
        )}`;
    }

    /** @param {import("three").ShaderLibShader} shader */
    #updateDefaultFragmentShader(shader)
    {
        shader.fragmentShader = `${parsFrag}
        ${shader.fragmentShader.replace(
            "#include <opaque_fragment>", `
            ${mainFrag}`
        )}`;
    }

    /** @param {import("three").ShaderLibShader} shader */
    onBeforeCompile(shader)
    {
        shader.uniforms.cellSize = { value: 50 };
        this.#updateDefaultFragmentShader(shader);
        this.#updateDefaultVertexShader(shader);
        this.needsUpdate = true;
    }
}
