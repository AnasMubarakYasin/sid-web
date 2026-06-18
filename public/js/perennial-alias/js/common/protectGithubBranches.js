const https=require("https");const buildLocal=require("./buildLocal");const BRANCH_NAME_PATTERNS=["main","*[0-9].[0-9]*"];const options={hostname:"api.github.com",path:"/graphql",method:"POST",headers:{Authorization:`Bearer ${buildLocal.developerGithubAccessToken}`,"Content-Type":"application/json","user-agent":"node.js"}};const createBranchProtectionRuleQueryData=repositoryName=>{return createQueryData(`query BranchProtectionRule {
    repository(owner: "phetsims", name: "${repositoryName}") { 
      branchProtectionRules(first: 100) { 
        nodes {
          # pattern for the rule 
          pattern,
          
          # uniqueID for the rule assigned by github, required to request deletion
          id
        }
      }
    } }`)};const createDeleteBranchProtectionRuleMutationData=ruleId=>{return createQueryData(`mutation {
    deleteBranchProtectionRule(input:{branchProtectionRuleId: "${ruleId}"} ) {
      clientMutationId
    }
  }`)};const createRepositoryRuleMutationData=(repositoryId,namePattern)=>{return createQueryData(`mutation {
    createBranchProtectionRule(input: {
      pattern: "${namePattern}",
      allowsDeletions: false,
  
      repositoryId: "${repositoryId}"
    } )
    
    # I think this specifies the data returned after the server receives the mutation request, not used but required
    # to send the mutation
    {
      branchProtectionRule {
        pattern
      }
    }
    }`)};const createRepositoryIdQueryData=repositoryName=>{return createQueryData(`query { repository(owner: "phetsims", name: "${repositoryName}") { id } }`)};const createQueryData=queryString=>{return JSON.stringify({query:queryString})};const getErrorMessage=jsonResponse=>{if(jsonResponse.errors){return jsonResponse.errors[0].message}else{return"No data returned"}};async function getRepositoryId(repositoryName){const handleJSONResponse=jsonResponse=>{if(!jsonResponse.data||jsonResponse.data.repository===null){throw new Error(`${getErrorMessage(jsonResponse)} Make sure developerGithubAccessToken in build-local.json may be incorrect or expired.`)}return jsonResponse.data.repository.id};return sendPromisedHttpsRequest(createRepositoryIdQueryData(repositoryName),handleJSONResponse)}async function getExistingBranchProtectionRules(repositoryName){const handleJSONResponse=jsonResponse=>{if(jsonResponse.errors){throw new Error(getErrorMessage(jsonResponse))}if(!jsonResponse.data){throw new Error(`No data returned by getExistingBranchProtectionRules for repo ${repositoryName}`)}return jsonResponse.data.repository.branchProtectionRules.nodes};return sendPromisedHttpsRequest(createBranchProtectionRuleQueryData(repositoryName),handleJSONResponse)}async function writeProtectionRule(repositoryId,namePattern){const handleJSONResponse=jsonResponse=>{if(jsonResponse.errors){throw new Error(getErrorMessage(jsonResponse))}};return sendPromisedHttpsRequest(createRepositoryRuleMutationData(repositoryId,namePattern),handleJSONResponse)}async function deleteExistingProtectionRule(ruleId,namePattern,repositoryName){const handleJSONResponse=jsonResponse=>{if(jsonResponse.errors){throw new Error(getErrorMessage(jsonResponse))}else{console.log(`Deleted existing branch protection rule ${namePattern} for repo ${repositoryName}`)}};return sendPromisedHttpsRequest(createDeleteBranchProtectionRuleMutationData(ruleId),handleJSONResponse)}async function deleteMatchingProtectionRules(rules,namePattern,repositoryName){const promises=[];rules.forEach(rule=>{if(rule.pattern===namePattern){promises.push(deleteExistingProtectionRule(rule.id,namePattern,repositoryName))}});return Promise.all(promises)}async function sendPromisedHttpsRequest(queryData,handle){return new Promise((resolve,reject)=>{const request=https.request(options,response=>{let responseBody="";response.on("data",d=>{responseBody+=d});response.on("end",()=>{const jsonResponse=JSON.parse(responseBody);try{const resolveValue=handle(jsonResponse);resolve(resolveValue)}catch(error){reject(error)}})});request.on("error",error=>{console.error(error)});request.write(queryData);request.end()})}async function clearBranchProtections(repositories){for(const repositoryName of repositories){for(const namePattern of BRANCH_NAME_PATTERNS){try{const branchProtectionRules=await getExistingBranchProtectionRules(repositoryName);await deleteMatchingProtectionRules(branchProtectionRules,namePattern,repositoryName)}catch(error){console.log(`Error clearing github protection rule ${namePattern} for ${repositoryName}`)}}}}async function protectBranches(repositories){const cleanedRepositories=repositories.map(repository=>repository.replace(/\/$/,""));await clearBranchProtections(cleanedRepositories);for(const repositoryName of cleanedRepositories){const repositoryId=await getRepositoryId(repositoryName);for(const namePattern of BRANCH_NAME_PATTERNS){try{await writeProtectionRule(repositoryId,namePattern);console.log(`${namePattern} protection rule set for ${repositoryName}`)}catch(error){console.log(`Error writing ${namePattern} rule for repo ${repositoryName}:`);console.log(error);console.log("\n")}}}}module.exports={protectBranches:protectBranches,clearBranchProtections:clearBranchProtections};