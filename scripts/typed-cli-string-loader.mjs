// A scoped, testable workaround for genlayer-cli's automatic conversion
// of digit-only --args into integers. It rewrites ONLY the CLI's argument
// decoder in memory. It neither reads wallet secrets nor modifies installed
// files. Node >= 23.5 (the user has Node v24).
import {registerHooks} from "node:module";
import {realpathSync} from "node:fs";
import {pathToFileURL} from "node:url";
const target=pathToFileURL(realpathSync(process.argv[1])).href;
if(!/\/genlayer\/dist\/index\.js$/.test(new URL(target).pathname))
  throw Error("Expected the official genlayer CLI dist/index.js entry file.");
registerHooks({
  load(url,ctx,nextLoad){
    const loaded=nextLoad(url,ctx);
    if(url!==target)return loaded;
    if(!loaded.source)throw Error("Cannot inspect CLI module source");
    let source=String(loaded.source);
    const header=/function parseArg\s*\(\s*([a-zA-Z_$][\w$]*)\s*,\s*([a-zA-Z_$][\w$]*)\s*(?:=\s*\[\s*\])?\s*\)\s*\{/;
    const match=source.match(header);
    if(!match)throw Error("CLI parseArg function signature changed; no command executed.");
    const [,value,previous]=match;
    const inserted=match[0] + "\n  if (typeof "+value+" === 'string' && "+value+".startsWith('str#')) { const typed = "+value+".slice(4); if (process.env.CS_TEST_TYPED_ID === '1') { if (typed !== '1') throw Error('wrong typed claim'); console.log('CONFIRMED_STRING_ARG='+JSON.stringify(typed)); process.exit(0); } return [..."+previous+", typed]; }\n";
    source=source.replace(match[0],inserted);
    if(!source.includes("startsWith('str#')"))throw Error("CLI type override not inserted");
    return {...loaded,source};
  }
});
