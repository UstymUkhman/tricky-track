const Ammo = await (await import('./Ammo')).default();

class Physics
{
    #engine = Ammo;
}

export default new Physics();
