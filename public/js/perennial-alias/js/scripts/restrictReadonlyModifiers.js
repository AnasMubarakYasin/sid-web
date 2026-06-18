import{execSync}from"child_process";import path from"path";import{Project}from"ts-morph";async function enforceReadonlyModifiers(repoPath){const project=new Project({tsConfigFilePath:`${repoPath}/tsconfig.json`});const sourceFiles=project.getSourceFiles(`${repoPath}/js/**/*.ts`);for(const sourceFile of sourceFiles){const classes=sourceFile.getClasses();for(const classDeclaration of classes){const className=classDeclaration.getName()||"<Unnamed Class>";console.log(`# Processing class: ${className}`);const properties=classDeclaration.getProperties();for(const property of properties){const propertyName=property.getName();const isReadonly=property.isReadonly();if(isReadonly){console.log(`  - Property '${propertyName}' is already readonly. Skipping.`);continue}console.log(`  - Attempting to set 'readonly' on property '${propertyName}'.`);property.setIsReadonly(true);await sourceFile.save();if(isBuildSuccessful(repoPath)){console.log(`    Successfully set 'readonly' on '${propertyName}'.`)}else{property.setIsReadonly(false);await sourceFile.save();console.log(`    Failed to set 'readonly' on '${propertyName}'. Reverted the change.`)}}}}}if(process.argv.includes("--help")){console.log(`
\x1b[1mUsage (run from the totality monorepo root):\x1b[0m
  \x1b[36mbash perennial-alias/bin/sage run perennial-alias/js/scripts/restrictReadonlyModifiers.ts <repo-directory>\x1b[0m

\x1b[1mParameters:\x1b[0m
  \x1b[33m<repo-directory>\x1b[0m - The repo directory name (relative to the totality root) whose
                       TypeScript files should be processed. Must contain a 'tsconfig.json'.

\x1b[1mOptions:\x1b[0m
  \x1b[32m--help\x1b[0m                  - Displays this help message and exits.

\x1b[1mExample:\x1b[0m
  \x1b[36mbash perennial-alias/bin/sage run perennial-alias/js/scripts/restrictReadonlyModifiers.ts quantum-wave-interference\x1b[0m

\x1b[1mNote:\x1b[0m
- Ensure that 'tsconfig.json' is correctly set up in your project root.
- The script currently targets files within the 'js/' directory by default. Adjust the glob pattern in the
  getSourceFiles method call if your project structure differs.
- This script requires Node.js and the 'ts-morph' and 'child_process' packages.
- The script makes changes to the repo as it progresses. If you look at the source files while this script 
  is running you will see the changes being made to trial values.
  `);process.exit(0)}if(process.argv.length<3){console.error("Error: Please provide the path to the repository directory. Check --help for instructions.");process.exit(1)}const repoPath=process.argv[2];function isBuildSuccessful(repoPath){try{const totalityRoot=path.resolve(__dirname,"..","..","..");execSync(`${totalityRoot}/bin/grunt type-check --repo=${repoPath}`,{cwd:totalityRoot,stdio:"pipe",encoding:"utf-8"});return true}catch(error){return false}}enforceReadonlyModifiers(repoPath).then(()=>console.log("Finished processing files.")).catch(error=>{console.error("An error occurred:",error);process.exit(1)});