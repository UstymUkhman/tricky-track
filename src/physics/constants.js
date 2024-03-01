// Activation state constants:
export const ACTIVE_TAG           = 1;
export const ISLAND_SLEEPING      = 2;
export const WANTS_DEACTIVATION   = 3;
export const DISABLE_DEACTIVATION = 4;
export const DISABLE_SIMULATION   = 5;

// Rigid Body constants:
export const RIGID_RESTITUTION     = 0;
export const RIGID_LINEAR_DAMPING  = 0;
export const RIGID_ANGULAR_DAMPING = 0;
export const RIGID_MARGIN          = 0.01;
export const RIGID_FRICTION        = 0.5;
export const RIGID_LINEAR_FACTOR   = 1;
export const RIGID_ANGULAR_FACTOR  = 1;

// Soft Body constants:
// export const SOFT_RESTITUTION = 0;
// export const SOFT_DAMPING     = 0.01;
// export const SOFT_MARGIN      = 0.02;
// export const SOFT_FRICTION    = 0.5;
// export const SOFT_STIFFNESS   = 1;
// export const SOFT_PITERATIONS = 40;
// export const SOFT_VITERATIONS = 40;

// Cloth Body constants:
// export const CLOTH_MARGIN      = 0.03;
// export const CLOTH_PITERATIONS = 10;
// export const CLOTH_VITERATIONS = 10;

// Rope Body constants:
// export const ROPE_MARGIN      = 0.05;
// export const ROPE_PITERATIONS = 10;
// export const ROPE_VITERATIONS = 10;

// Constraint constants:
// export const CONSTRAINT_THRESHOLD =    0;
// export const SLIDER_ACCELERATION  =   50;
// export const HINGE_ACCELERATION   =  100;
// export const CONETWIST_IMPULSE    =  100;
// export const GENERIC_VELOCITY     =  100;
// export const GENERIC_MAX_FORCE    = 1000;

// Collision constants:
// export const CCD_MOTION_THRESHOLD = 1e-5;
// export const STATIC_COLLISION     =    1;
// export const KINEMATIC_COLLISION  =    2;
// export const IGNORED_COLLISION    =    4;
// export const SOFT_COLLISION       = 0x11;

// Group constants:
// export const GROUP_NONE      =    0;
// export const GROUP_DEFAULT   =    1;
export const GROUP_STATIC    =    2;
// export const GROUP_KINEMATIC =    4;
export const GROUP_DYNAMIC   =  128;
// export const GROUP_SOFT      =  256;
// export const GROUP_CLOTH     =  512;
// export const GROUP_ROPE      = 1024;

// Mask constants
export const MASK_ALL                     = 0xFFFF;
// export const MASK_SOFT                    = GROUP_SOFT;
// export const MASK_ROPE                    = GROUP_ROPE;
// export const MASK_CLOTH                   = GROUP_CLOTH;
// export const MASK_STATIC                  = GROUP_STATIC;
// export const MASK_DYNAMIC                 = GROUP_DYNAMIC;
// export const MASK_KINEMATIC               = GROUP_KINEMATIC;
// export const MASK_STATIC_AND_KINEMATIC    = GROUP_STATIC  | GROUP_KINEMATIC;
// export const MASK_FLEX                    = GROUP_SOFT    | GROUP_CLOTH     | GROUP_ROPE;
// export const MASK_RIGID                   = GROUP_STATIC  | GROUP_KINEMATIC | GROUP_DYNAMIC;

// export const MASK_NOT_SOFT                = 0xFFFF ^ GROUP_SOFT;
// export const MASK_NOT_CLOTH               = 0xFFFF ^ GROUP_CLOTH;
// export const MASK_NOT_STATIC              = 0xFFFF ^ GROUP_STATIC;
// export const MASK_NOT_DYNAMIC             = 0xFFFF ^ GROUP_DYNAMIC;
// export const MASK_NOT_KINEMATIC           = 0xFFFF ^ GROUP_KINEMATIC;
// export const MASK_NOT_STATIC_OR_KINEMATIC = 0xFFFF ^ MASK_STATIC_AND_KINEMATIC;
