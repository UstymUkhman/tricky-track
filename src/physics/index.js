import SAB from "../utils/SAB";
import Embedded from "./Embedded";

export default SAB.supported ? null : new Embedded();
