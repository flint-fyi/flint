import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

await execFileAsync("git", [
	"-C",
	path.resolve(import.meta.dirname, ".."),
	"config",
	"--local",
	"include.path",
	"../.gitconfig",
]);
