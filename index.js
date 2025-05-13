// import express from "express";
// import fs from "fs";
// import { exec } from "child_process";
// import { v4 as uuid } from "uuid";
// import bodyParser from "body-parser";

// const app = express();
// app.use(bodyParser.json());

// app.post("/run-java", (req, res) => {
//   const javaCode = req.body.code;

//   if (!javaCode) {
//     return res.status(400).json({ error: "No code provided" });
//   }

//   const className = "Solution";
//   const filename = `${className}.java`;
//   const classFile = `${className}.class`
//   const filePath = `codeFiles/${filename}`;
//   const classFileName = `codeFiles/${classFile}`

//   // Write the Java code to file
//   fs.writeFileSync(filePath, javaCode);

//   // Compile the Java file
//   exec(`javac ${filePath}`, (compileErr, _, compileStderr) => {
//     if (compileErr || compileStderr) {
//       return res.status(500).json({
//         status: "Compilation Error",
//         output: compileErr?.message || compileStderr,
//       });
//     }

//     // Run the compiled class
//     exec(`java -cp codeFiles ${className}`, (runErr, stdout, stderr) => {
//       if (runErr || stderr) {
//         return res.status(500).json({
//           status: "Runtime Error",
//           output: runErr?.message || stderr,
//         });
//       }
//       try{
//         fs.unlinkSync(filePath)
//         fs.unlinkSync(classFileName)
//         console.log("Both The Files Are Get Deleted SuccessFully !")
//       }
//       catch(e){
//         console.log("Got Error While Deleting");
//       }
//       return res.status(200).json({
//         status: "Success",
//         output: stdout.trim(),
//       });
//     });
//   });
// });

// app.listen(3000, () => {
//   console.log("Java executor running on http://localhost:3000");
// });



import express from "express";
import fs from "fs";
import { exec } from "child_process";
import { v4 as uuid } from "uuid";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";

const app = express();

app.use(cors());

app.use(bodyParser.json());

const EXTENSIONS = {
  java: "java",
  js: "js",
  ts: "ts",
  py: "py",
  rs: "rs", // Rust
};

const getExecutionCommand = (lang, filePath, baseName) => {
  switch (lang) {
    case "java":
      return `javac ${filePath} && java -cp codeFiles ${baseName}`;
    case "js":
      return `node ${filePath}`;
    case "ts":
      return `tsc ${filePath} --outDir codeFiles && node codeFiles/${baseName}.js`;
    case "py":
      return `python3 ${filePath}`;
    case "rs":
      return `rustc ${filePath} -o codeFiles/${baseName} && codeFiles/${baseName}`;
    default:
      throw new Error("Unsupported language");
  }
};

app.post("/run-code", (req, res) => {
  const { fileNames, code, language } = req.body;

  if (!code || !language || !(language in EXTENSIONS)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const ext = EXTENSIONS[language];
  const baseName = `${fileNames}`;
  const fileName = `${baseName}.${ext}`;
  const filePath = path.join("codeFiles", fileName);

  fs.writeFileSync(filePath, code);

  let command;
  try {
    command = getExecutionCommand(language, filePath, baseName);
  } catch (e) {
    return res.status(400).json({ error: "Language not supported" });
  }

  exec(command, (err, stdout, stderr) => {
    try {
      fs.unlinkSync(filePath);
      if (language === "java") fs.unlinkSync(`codeFiles/${baseName}.class`);
      if (language === "ts") fs.unlinkSync(`codeFiles/${baseName}.js`);
      if (language === "rs") fs.unlinkSync(`codeFiles/${baseName}`);
    } catch (e) {
      console.log("Cleanup failed:", e);
    }

    if (err || stderr) {
      return res.status(500).json({
        status: "Error",
        output: err?.message || stderr,
      });
    }

    return res.status(200).json({
      status: "Success",
      output: stdout.trim(),
    });
  });
});

app.listen(3000, () => {
  console.log("Multi-language code executor running at http://localhost:3000");
});
