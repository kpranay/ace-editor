import * as yaml from 'js-yaml';

export class DataConverter {
  private _s?: string;
  private _inType?: 'json' | 'properties' | 'yaml';

  private _internalStructure: any = {};

  private _spaces = 2;

  public fromProperties(s: string): DataConverter {
    this._s = s;
    this._inType = 'properties';
    return this;
  }

  public fromJson(s: string): DataConverter {
    this._s = s;
    this._inType = 'json';
    return this;
  }

  public fromYaml(s: string): DataConverter {
    this._s = s;
    this._inType = 'yaml';
    return this;
  }

  public convert(): DataConverter {
    if (!this._s) {
      throw new Error('Input of conversion is empty! Did you call any of fromString(string) or fromFile(path)?');
    }

    if (this._inType === 'json') {
      this._internalStructure = JSON.parse(this._s);
    } else if(this._inType === 'yaml') {
      this._internalStructure = yaml.load(this._s);
    } else {
      this._internalStructure = this.propertiesFileToObject(this._s);
    }

    return this;
  }

  private unescapePropertyValue(value) {
    // Replace common escape sequences with their actual characters
    // return value
    //     .replace(/\\n/g, '\n')  // Newline
    //     .replace(/\\r/g, '\r')  // Carriage return
    //     .replace(/\\t/g, '\t')  // Tab
    //     .replace(/\\\\/g, '\\') // Backslash
    //     .replace(/\\"/g, '\"')  // Double quote
    //     .replace(/\\'/g, '\''); // Single quote

    // Unescape special characters
    const unescaped = value
    .replace(/\\n/g, '\n')   // Unescape new lines
    .replace(/\\r/g, '\r')   // Unescape carriage returns
    .replace(/\\=/g, '=')     // Unescape equals signs
    .replace(/\\\\/g, '\\');  // Unescape backslashes

    // Try to convert to number or boolean
    if (!isNaN(Number(unescaped))) {
        return Number(unescaped);
    }
    if (unescaped === 'true') {
        return true;
    }
    if (unescaped === 'false') {
        return false;
    }
    return unescaped; // Return as string if not a number or boolean
  }

  private propertiesFileToObject(properties: string): any {
    const result = {};

    properties.split('\n').forEach(line => {
        line = line.trim();
        if (!line) return; // Skip empty lines

        const parts = line.split('=');
        if (parts.length !== 2) return; // Skip invalid lines

        const path = parts[0].trim().replace(/\[(\d+)\]/g, '.$1');
        const value = this.unescapePropertyValue(parts[1].trim());

        // Create nested structure
        const keys = path.split('.');
        let current = result;

        keys.forEach((key, index) => {
            // If it's the last key, set the value
            if (index === keys.length - 1) {
                // Initialize the array if it doesn't exist
                if (!current[key]) {
                    current[key] = typeof value === 'number' ? value : [];
                } else if (Array.isArray(current[key])) {
                    // Push value to existing array
                    current[key].push(value);
                } else {
                    // Convert existing value to an array and add the new value
                    current[key] = [current[key], value];
                }
            } else {
                // Initialize object or array if not present
                current[key] = current[key] || (isNaN(Number(keys[index + 1])) ? {} : []);
                current = current[key];
            }
        });
    });

    return result;
  }

  private _buildYamlOutputFromInternalStructure(internalStructure: any, depth = 0): string {
    // Starts with an empty string
    let s = ``;

    // For each key, value pair in the internal structure
    for (let [key, value] of Object.entries(internalStructure)) {
        // Write down the key with correct spaces based on the depth
        s += `${' '.repeat(this._spaces * depth)}${key}:`;

        // If the value is an array
        if (Array.isArray(value)) {
            s += `\n`;
            for (const item of value) {
                s += `${' '.repeat(this._spaces * (depth + 1))}- `;
                if (item !== null && typeof item === 'object') {
                    s += `\n${this._buildYamlOutputFromInternalStructure(item, depth + 2)}`;
                } else {
                    // If the value is a string
                    let itemValue = typeof item === 'string' ? JSON.stringify(item) : item;
                    s += `${itemValue}\n`;
                }
            }
        } else if (value !== null && typeof value === 'object') {
            // If the value is an object
            s += `\n${this._buildYamlOutputFromInternalStructure(value, depth + 1)}`;
        } else {
            // Otherwise it's a primitive type/string
            let itemValue = typeof value === 'string' ? JSON.stringify(value) : value;
            s += ` ${itemValue}\n`;
        }
    }
    return s;
  }


  public toYaml(): string {
    if (!this._internalStructure) {
      throw new Error('Output of conversion is empty! Did you call convert() method?');
    }
    
    return this._buildYamlOutputFromInternalStructure(this._internalStructure);
  }

  public toJson(): any {
    if (!this._internalStructure) {
      throw new Error('Output of conversion is empty! Did you call convert() method?');
    }

    return JSON.stringify(this._internalStructure, undefined, this.getSpaces);
  }

  public toString() {
    throw new Error("unsupported");
  }

  public toProperties() {
    if (!this._internalStructure) {
      throw new Error('Output of conversion is empty! Did you call convert() method?');
    }

    return this.objectToPropertiesFile(this._internalStructure);
  }

  private objectToPropertiesFile(obj) {
    const flattened = this.flattenObject(obj);
    return Object.entries(flattened)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
  }

  private flattenObject(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const newKey = parentKey ? `${parentKey}.${key}` : key;

            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    const arrayKey = `${newKey}[${index}]`;
                    if (item && typeof item === 'object') {
                        this.flattenObject(item, arrayKey, result);
                    } else {
                        result[arrayKey] = this.escapePropertyValue(String(item));
                    }
                });
            } else if (value && typeof value === 'object') {
                this.flattenObject(value, newKey, result);
            } else {
                result[newKey] = this.escapePropertyValue(String(value));
            }
        }
    }
    return result;
  }

  private escapePropertyValue(value) {
    if (typeof value !== 'string') return value;
    return value
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/=/g, '\\=')   // Escape equals signs
        .replace(/\n/g, '\\n')  // Escape new lines
        .replace(/\r/g, '\\r'); // Escape carriage returns
  }

  public spaces(spaces: number): DataConverter {
    this._spaces = spaces;
    return this;
  }

  public get getSpaces(): number {
    return this._spaces;
  }

  public get inputString(): string | undefined {
    return this._s;
  }

}

export default DataConverter;
