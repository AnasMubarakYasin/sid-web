import DerivedProperty from"../../../axon/js/DerivedProperty.js";import Property from"../../../axon/js/Property.js";import localeProperty from"../../../joist/js/i18n/localeProperty.js";import FluentConstant from"./FluentConstant.js";import FluentPattern from"./FluentPattern.js";import FluentComment from"./FluentComment.js";export default function showFluentTable(simFluent,translationLocale){window.phetSplashScreen&&window.phetSplashScreen.dispose();const container=document.createElement("div");container.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 10000;
    font-family: Arial, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;const header=document.createElement("div");header.style.cssText=`
    background: #2c3e50;
    color: white;
    padding: 1rem 1.5rem;
    flex-shrink: 0;
  `;const title=document.createElement("h1");title.textContent="Fluent String Evaluation Tool";title.style.cssText=`
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  `;const subtitle=document.createElement("p");subtitle.textContent="Evaluate fluent string translations with real-time parameter interpolation";subtitle.style.margin="0";header.appendChild(title);header.appendChild(subtitle);const controls=document.createElement("div");controls.style.cssText=`
    background: #ecf0f1;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #bdc3c7;
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    flex-shrink: 0;
  `;const checkboxes=[{id:"showKey",label:"Show Key",checked:true},{id:"showOptions",label:"Show Options",checked:true},{id:"showEnglish",label:"Show English",checked:true},{id:"showTranslation",label:"Show Translation",checked:true}];checkboxes.forEach(({id,label,checked})=>{const controlGroup=document.createElement("label");controlGroup.style.cssText=`
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: bold;
      color: #2c3e50;
      cursor: pointer;
    `;const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.id=id;checkbox.checked=checked;checkbox.addEventListener("change",updateColumnVisibility);const labelText=document.createElement("span");labelText.textContent=label;controlGroup.appendChild(checkbox);controlGroup.appendChild(labelText);controls.appendChild(controlGroup)});const localeGroup=document.createElement("div");localeGroup.style.cssText=`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: bold;
    color: #2c3e50;
  `;const localeLabel=document.createElement("span");localeLabel.textContent="Locale:";const localeInput=document.createElement("select");localeInput.id="localeInput";localeInput.style.cssText=`
    padding: 0.25rem;
    border: 1px solid #bdc3c7;
    border-radius: 3px;
    font-size: 0.85rem;
  `;localeProperty.availableRuntimeLocales.forEach(locale=>{const option=document.createElement("option");option.value=locale;option.textContent=locale;if(locale===translationLocale){option.selected=true}localeInput.appendChild(option)});const userSelectedLocaleProperty=new Property(translationLocale);localeInput.addEventListener("change",()=>{userSelectedLocaleProperty.value=localeInput.value});localeGroup.appendChild(localeLabel);localeGroup.appendChild(localeInput);controls.appendChild(localeGroup);const tableContainer=document.createElement("div");tableContainer.style.cssText=`
    flex: 1;
    overflow: auto;
    background: white;
  `;const table=document.createElement("table");table.style.cssText=`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  `;const thead=document.createElement("thead");const headerRow=document.createElement("tr");const headers=[{id:"keyHeader",text:"Key"},{id:"optionsHeader",text:"Options"},{id:"englishHeader",text:"English"},{id:"translationHeader",text:"Translation"}];headers.forEach(({id,text})=>{const th=document.createElement("th");th.id=id;th.textContent=text;th.style.cssText=`
      background: #34495e;
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: bold;
      position: sticky;
      top: 0;
      z-index: 10;
      border-right: 1px solid #2c3e50;
    `;headerRow.appendChild(th)});thead.appendChild(headerRow);table.appendChild(thead);const tbody=document.createElement("tbody");table.appendChild(tbody);tableContainer.appendChild(table);const fluentEntries=[];const collectEntries=(obj,prefix="",seen=new WeakSet)=>{if(obj===null||typeof obj!=="object"){return}if(seen.has(obj)){return}seen.add(obj);for(const key of Object.keys(obj)){const value=obj[key];const fullKey=prefix?`${prefix}.${key}`:key;if(value instanceof FluentConstant){fluentEntries.push({key:fullKey,fluentConstant:value,isConstant:true,isComment:false})}else if(value instanceof FluentPattern){fluentEntries.push({key:fullKey,fluentPattern:value,isConstant:false,isComment:false})}else if(value instanceof FluentComment){fluentEntries.push({key:fullKey,fluentComment:value,isConstant:false,isComment:true})}else{collectEntries(value,fullKey,seen)}}};collectEntries(simFluent);const rowParameterProperties=new Map;const rowEnglishProperties=new Map;const rowTranslationProperties=new Map;fluentEntries.forEach(entry=>{const row=document.createElement("tr");row.style.cssText=`
      border-bottom: 1px solid #ecf0f1;
    `;row.classList.add("fluent-row");const keyCell=document.createElement("td");keyCell.className="key-cell";keyCell.textContent=entry.key;keyCell.style.cssText=`
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #2c3e50;
      padding: 0.75rem;
      vertical-align: top;
      min-width: 200px;
      max-width: 300px;
      word-break: break-word;
      border-right: 1px solid #ecf0f1;
    `;const optionsCell=document.createElement("td");optionsCell.className="options-cell";optionsCell.style.cssText=`
      padding: 0.75rem;
      vertical-align: top;
      min-width: 200px;
      max-width: 300px;
      border-right: 1px solid #ecf0f1;
    `;const englishCell=document.createElement("td");englishCell.className="english-cell";englishCell.style.cssText=`
      padding: 0.75rem;
      vertical-align: top;
      max-width: 400px;
      word-wrap: break-word;
      color: #2c74e8;
      border-right: 1px solid #ecf0f1;
    `;const translationCell=document.createElement("td");translationCell.className="translation-cell";translationCell.style.cssText=`
      padding: 0.75rem;
      vertical-align: top;
      max-width: 400px;
      word-wrap: break-word;
      color: black;
    `;if(entry.isConstant&&entry.fluentConstant){optionsCell.textContent="";optionsCell.style.fontStyle="italic";optionsCell.style.color="#2c74e8";localeProperty.value="en";const result=entry.fluentConstant.value;const englishProperty=new Property(result);const translationProperty=new DerivedProperty([userSelectedLocaleProperty],()=>{localeProperty.value=userSelectedLocaleProperty.value;return entry.fluentConstant.value});englishProperty.link(value=>{englishCell.textContent=value});translationProperty.link(value=>{translationCell.textContent=value});rowEnglishProperties.set(entry.key,englishProperty);rowTranslationProperties.set(entry.key,translationProperty)}else if(!entry.isConstant&&entry.fluentPattern){const pattern=entry.fluentPattern;const inputContainer=document.createElement("div");const parameterProperties=new Map;if(pattern.args&&pattern.args.length>0){pattern.args.forEach((argDef,index)=>{const inputGroup=document.createElement("div");inputGroup.style.cssText=`
            margin-bottom: 0.5rem;
          `;const label=document.createElement("label");label.style.cssText=`
            display: block;
            font-weight: bold;
            margin-bottom: 0.25rem;
            font-size: 0.8rem;
            color: #34495e;
          `;const paramName=argDef.name||`param${index}`;const variants=argDef.variants;label.textContent=paramName;let input;let variantMap;let parameterProperty;if(variants&&variants.length>0){input=document.createElement("select");variantMap=new Map;variants.forEach((variant,index)=>{const option=document.createElement("option");const value=typeof variant==="object"&&variant.value!==undefined?variant.value:variant;const optionKey=`${index}`;option.value=optionKey;option.textContent=String(value);variantMap.set(optionKey,value);input.appendChild(option)});input.style.cssText=`
              width: 100%;
              padding: 0.25rem;
              border: 1px solid #bdc3c7;
              border-radius: 3px;
              font-size: 0.8rem;
            `;parameterProperty=new Property(variantMap.get(input.value))}else{input=document.createElement("input");input.type="text";input.value=`{ $${paramName} }`;input.style.cssText=`
              width: 100%;
              padding: 0.25rem;
              border: 1px solid #bdc3c7;
              border-radius: 3px;
              font-size: 0.8rem;
            `;parameterProperty=new Property(input.value)}input.addEventListener("input",()=>{if(variantMap){parameterProperty.value=variantMap.get(input.value)}else{parameterProperty.value=input.value}});parameterProperties.set(paramName,parameterProperty);inputGroup.appendChild(label);inputGroup.appendChild(input);inputContainer.appendChild(inputGroup)})}else{const noParamsText=document.createElement("span");noParamsText.textContent="No parameters defined";noParamsText.style.cssText=`
          font-style: italic;
          color: #7f8c8d;
        `;inputContainer.appendChild(noParamsText)}optionsCell.appendChild(inputContainer);rowParameterProperties.set(entry.key,parameterProperties);const parameterObject={};parameterProperties.forEach((property,paramName)=>{parameterObject[paramName]=property});const englishProperty=DerivedProperty.deriveAny(Array.from(parameterProperties.values()),()=>{localeProperty.value="en";try{return pattern.createProperty(parameterObject).value}catch(error){return`Error: ${error instanceof Error?error.message:String(error)}`}});const translationProperty=DerivedProperty.deriveAny([userSelectedLocaleProperty,...Array.from(parameterProperties.values())],()=>{localeProperty.value=userSelectedLocaleProperty.value;try{return pattern.format(parameterObject)}catch(error){return`Error: ${error instanceof Error?error.message:String(error)}`}});englishProperty.link(value=>{englishCell.textContent=value;englishCell.style.color=value.startsWith("Error:")?"#e74c3c":"#2c74e8"});translationProperty.link(value=>{translationCell.textContent=value;translationCell.style.color=value.startsWith("Error:")?"#e74c3c":"black"});rowEnglishProperties.set(entry.key,englishProperty);rowTranslationProperties.set(entry.key,translationProperty)}else if(entry.isComment&&entry.fluentComment){row.style.cssText+=`
        background-color: #f8f9fa;
        border-left: 4px solid #6c757d;
      `;const commentCell=document.createElement("td");commentCell.setAttribute("colspan","4");commentCell.textContent=entry.fluentComment.comment;commentCell.style.cssText=`
        padding: 0.75rem;
        font-weight: bold;
        font-size: 1rem;
        color: #2c3e50;
        background-color: #f8f9fa;
        text-align: left;
      `;row.appendChild(commentCell)}if(!entry.isComment){row.appendChild(keyCell);row.appendChild(optionsCell);row.appendChild(englishCell);row.appendChild(translationCell)}tbody.appendChild(row)});container.appendChild(header);container.appendChild(controls);container.appendChild(tableContainer);document.body.appendChild(container);function updateColumnVisibility(){const showKey=document.getElementById("showKey").checked;const showOptions=document.getElementById("showOptions").checked;const showEnglish=document.getElementById("showEnglish").checked;const showTranslation=document.getElementById("showTranslation").checked;const keyHeader=document.getElementById("keyHeader");const optionsHeader=document.getElementById("optionsHeader");const englishHeader=document.getElementById("englishHeader");const translationHeader=document.getElementById("translationHeader");if(keyHeader){keyHeader.style.display=showKey?"":"none"}if(optionsHeader){optionsHeader.style.display=showOptions?"":"none"}if(englishHeader){englishHeader.style.display=showEnglish?"":"none"}if(translationHeader){translationHeader.style.display=showTranslation?"":"none"}const keyCells=document.querySelectorAll(".key-cell");const optionsCells=document.querySelectorAll(".options-cell");const englishCells=document.querySelectorAll(".english-cell");const translationCells=document.querySelectorAll(".translation-cell");keyCells.forEach(cell=>{cell.style.display=showKey?"":"none"});optionsCells.forEach(cell=>{cell.style.display=showOptions?"":"none"});englishCells.forEach(cell=>{cell.style.display=showEnglish?"":"none"});translationCells.forEach(cell=>{cell.style.display=showTranslation?"":"none"})}const style=document.createElement("style");style.textContent=`
    @media (max-width: 768px) {
      .fluent-row td {
        padding: 0.5rem 0.25rem !important;
        font-size: 0.8rem !important;
      }
      .fluent-row .key-cell {
        min-width: 120px !important;
        max-width: 200px !important;
      }
      .fluent-row .options-cell {
        min-width: 150px !important;
        max-width: 250px !important;
      }
    }
  `;document.head.appendChild(style);userSelectedLocaleProperty.value=translationLocale}