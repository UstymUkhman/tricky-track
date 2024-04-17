import Physics from "../../physics/Shared";
import { Clock } from "three/src/core/Clock";

/** @type {Physics | null} */ let raf, physics = null;
/** @type {Worker} */ export const Worker = self;

const clock = new Clock();

function simulationLoop()
{
    // ...or RAF.delta * 1e-3:
    physics.update(clock.getDelta());
    raf = requestAnimationFrame(simulationLoop);
}

Worker.onerror = error => console.error(error);

Worker.onmessage = message =>
{
    const { event, params } = message.data;

    if (event !== "Physics::Init" && !physics)
    {
        throw new Error("Physics engine is not initialized.");
    }

    switch (event)
    {
        case "Physics::Init":
            physics = new Physics(() =>
                Worker.postMessage({ name: event })
            );
        break;

        case "Physics::Start":
            raf = requestAnimationFrame(simulationLoop);
        break;

        case "Physics::Set::SharedArrayBuffer":
            physics.setSharedTransformBuffer(params.buffer);
        break;

        case "Physics::Add::StaticPlane":
            physics.addStaticPlane(params);
        break;

        case "Physics::Add::KinematicBox":
            physics.addKinematicBox(params);
        break;

        case "Physics::Move::KinematicBody":
            physics.moveKinematicBody(params);
        break;

        case "Physics::Remove::KinematicBody":
            physics.removeKinematicBody(params);
        break;

        case "Physics::Get::VehicleTuning":
            Worker.postMessage({
                name: event,
                response: physics.vehicleTuning
            });
        break;

        case "Physics::Add::Vehicle":
            Worker.postMessage({
                name: event,
                response: physics.addVehicle(
                    params.chassis,
                    params.tuning
                )
            });
        break;

        case "Physics::Add::Wheel":
            Worker.postMessage({
                name: event,
                response: physics.addWheel(
                    params.tuning,
                    params.config,
                    params.radius,
                    params.index
                )
            });
        break;

        case "Physics::Reset::Vehicle":
            physics.resetVehicle(params);
        break;

        case "Physics::Dispose":
            cancelAnimationFrame(raf);
            physics.dispose();
        break;
    }
};
