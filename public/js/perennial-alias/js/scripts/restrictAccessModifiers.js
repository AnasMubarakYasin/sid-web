import{execSync}from"child_process";import path from"path";import{Project,Scope}from"ts-morph";async function restrictAccessModifiers(repoPath){const project=new Project({tsConfigFilePath:`${repoPath}/tsconfig.json`});const sourceFiles=project.getSourceFiles(`${repoPath}/js/**/*.ts`);for(const sourceFile of sourceFiles){const classes=sourceFile.getClasses();for(const classDeclaration of classes){console.log(`# Processing class: ${classDeclaration.getName()}`);const members=[...classDeclaration.getInstanceProperties(),...classDeclaration.getInstanceMethods(),...classDeclaration.getStaticProperties(),...classDeclaration.getStaticMethods()];for(const member of members){console.log(member.getScope()+" "+member.getName());if(member.getScope()==="public"||member.getScope()==="protected"){member.setScope(Scope.Private);await sourceFile.save();if(!isBuildSuccessful()){member.setScope(Scope.Protected);await sourceFile.save();if(!isBuildSuccessful()){member.setScope(Scope.Public);await sourceFile.save()}else{console.log(`    Successfully changed ${member.getName()} to protected.`)}}else{console.log(`    Successfully changed ${member.getName()} to private.`)}}}}}}if(process.argv.includes("--help")){console.log(`
\x1b[1mUsage (run from the totality monorepo root):\x1b[0m
  \x1b[36mbash perennial-alias/bin/sage run perennial-alias/js/scripts/restrictAccessModifiers.ts <repo-directory>\x1b[0m

\x1b[1mParameters:\x1b[0m
  \x1b[33m<repo-directory>\x1b[0m - The repo directory name (relative to the totality root) whose
                       TypeScript files should be processed. Must contain a 'tsconfig.json'.

\x1b[1mOptions:\x1b[0m
  \x1b[32m--help\x1b[0m                  - Displays this help message and exits.

\x1b[1mExample:\x1b[0m
  \x1b[36mbash perennial-alias/bin/sage run perennial-alias/js/scripts/restrictAccessModifiers.ts quantum-wave-interference\x1b[0m

\x1b[1mNote:\x1b[0m
- Ensure that 'tsconfig.json' is correctly set up in your project root.
- The script currently targets files within the 'js/' directory by default. Adjust the glob pattern in the
  getSourceFiles method call if your project structure differs.
- This script requires Node.js and the 'ts-morph' and 'child_process' packages.
- The script makes changes to the repo as it progresses. If you look at the source files while this script 
  is running you will see the changes being made to trial values.
  `);process.exit(0)}if(process.argv.length<3){console.error("Error: Please provide the path to the repository directory. Check --help for instructions.");process.exit(1)}const repoPath=process.argv[2];function isBuildSuccessful(){try{const totalityRoot=path.resolve(__dirname,"..","..","..");execSync(`${totalityRoot}/bin/grunt type-check --repo=${repoPath}`,{cwd:totalityRoot,stdio:"pipe",encoding:"utf-8"});return true}catch(error){return false}}restrictAccessModifiers(repoPath).then(()=>console.log("Finished processing files."));