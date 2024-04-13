import Shared from "./Shared";
import SAB from "../utils/SAB";
import Embedded from "./Embedded";

export default SAB.supported ? Shared : Embedded;
