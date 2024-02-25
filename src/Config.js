import { ACESFilmicToneMapping, SRGBColorSpace } from "three/src/constants";
import { Vector2 } from "three/src/math/Vector2";
import { Vector3 } from "three/src/math/Vector3";
import { Euler } from "three/src/math/Euler";
import { Color } from "three/src/math/Color";

export default
{
    Scene:
    {
        background: Color.NAMES.whitesmoke,
        toneMapping: ACESFilmicToneMapping,
        outputColorSpace: SRGBColorSpace,
        toneMappingExposure: 1.5
    },

    Camera:
    {
        position: new Vector3(0, 35, 70),
        target: new Vector3(0, 6, 0),
        near: 0.1,
        far: 500,
        fov: 50
    },

    Lights:
    {
        ambient:
        {
          color: Color.NAMES.white,
          intensity: 0.5
        },

        directional:
        {
            position: new Vector3(0, 35, 70),
            rotation: new Euler(1, 0, 0),
            color: Color.NAMES.white,
            intensity: 2,

            shadow:
            {
                cast: true,
                mapSize: new Vector2(1024, 1024),

                camera:
                {
                    bottom: -50,
                    right: 100,
                    left: -100,
                    far: 200,
                    near: 1,
                    top: 60
                }
            },

            helper:
            {
                color: Color.NAMES.white,
                visible: DEBUG,
                size: 10
            }
        }
    },

    Ground:
    {
        color: Color.NAMES.white,
        size: 500,
        cell: 50
    },

    Fog:
    {
        color: Color.NAMES.whitesmoke,
        visible: true,
        near: 100,
        far: 250
    }
};
