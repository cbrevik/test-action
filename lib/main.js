"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const prettier_1 = __importDefault(require("prettier"));
function handlePullRequest(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pull_request } = payload;
        if (!pull_request) {
            throw new Error("pull_request was not defined");
        }
        const { ref: headRef, sha: headSha } = pull_request.head;
        const repoToken = core.getInput('repo-token', { required: true });
        const client = new github.GitHub(repoToken);
        const { owner, repo } = github.context.repo;
        const prFilesResponse = yield client.pulls.listFiles({
            owner,
            repo,
            pull_number: pull_request.number
        });
        var fileShas = prFilesResponse.data.map(f => ({ sha: f.sha, filename: f.filename }));
        const fileContents = yield Promise.all(fileShas.map(({ filename }) => getContent(client, owner, repo, filename, headRef)));
        const formattedFiles = yield Promise.all(fileContents.map(({ filename, content }) => __awaiter(this, void 0, void 0, function* () {
            const fileInfo = yield prettier_1.default.getFileInfo(filename);
            return {
                shouldFormat: prettier_1.default.check(content, { parser: fileInfo.inferredParser }),
                filename
            };
        })));
        yield client.checks.create({
            owner,
            repo,
            name: "Check if needs to be formatted",
            head_sha: headSha,
            conclusion: "action_required",
            actions: [
                { label: "Fix formatting", description: "Fix formatting of file", identifier: "FORMATY_FOX" }
            ]
        });
    });
}
exports.handlePullRequest = handlePullRequest;
function handleRequestedAction(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(payload.check_run);
    });
}
exports.handleRequestedAction = handleRequestedAction;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { eventName, payload: { action } } = github.context;
            if (eventName === "pull_request"
                && (action === 'opened' || action === 'edited' || action === 'synchronize')) {
                handlePullRequest(github.context.payload);
            }
            if (eventName === "check_run" && action === "requested_action") {
                handleRequestedAction(github.context.payload);
            }
        }
        catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    });
}
exports.run = run;
function getContent(client, owner, repo, path, ref) {
    return __awaiter(this, void 0, void 0, function* () {
        var result = yield client.repos.getContents({
            owner,
            repo,
            path,
            ref
        });
        const content = Buffer.from(result.data.content, 'base64').toString();
        return {
            filename: path,
            content
        };
    });
}
run();
