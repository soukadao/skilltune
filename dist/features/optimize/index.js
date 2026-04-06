import { lazy } from "gunshi/definition";
import meta from "./meta.js";
export default lazy(async () => {
    const { run } = await import("./run.js");
    return run;
}, meta);
