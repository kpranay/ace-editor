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

      const rows = this._s.split(/\r?\n/); // Splits new lines
      for (const row of rows) {
        // If line is empty
        if (row.trim().length === 0) {
          // Skip it
          continue;
        }
  
        const [key, value] = row.split('=').map((part) => part.trim()); // Splits KEY=VALUE and removes white spaces
        const keys = key.split('.'); // Divides key into array (eg: spring.datasource.url becomes ['spring', 'datasource', 'url'])
  
        let v: any = value;
        // Tries to convert the value to a boolean
        if (v.toLowerCase() === 'true' || v.toLowerCase() === 'false') {
          v = v.toLowerCase() === 'true';
        } else {
          // If it was not a boolean, then it tries to convert it to a float/int
          const tryFloat = parseFloat(v);
          v = !isNaN(tryFloat) ? tryFloat : v; // if it was not a float/int, then it's a string
        }
  
        this._buildInternalStructure(this._internalStructure, keys, v);
      }
    }

    return this;
  }

  private _buildInternalStructure(internalStructure: any, keys: string[], value: any): void {
    // If it's the last key (base case)
    if (keys.length === 1) {
      // Simply write the value in the data structure
      internalStructure[keys[0]] = value;
      return;
    }

    // If the key does not exist in the data structure
    if (!internalStructure[keys[0]]) {
      // Create one with an empty object
      internalStructure[keys[0]] = {};
    }

    /**
     * Recursively build internal structure by going deeper in the key-path, removing the
     * first key of the array, which is the one we just processed and pass on the value
     */
    this._buildInternalStructure(internalStructure[keys[0]], keys.slice(1), value);
  }

  private _buildOutputFromInternalStructure(internalStructure: any, depth = 0): string {
    // Starts with an empty string
    let s = ``;

    // For each key,value pair in the internal structure
    for (const [key, value] of Object.entries(internalStructure)) {
      // Write down the key with correct spaces based on the depth
      s += `${' '.repeat(this._spaces * depth)}${key}:`;

      // If the value is an object
      if (value !== null && typeof value === 'object') {
        // Recursively build it, adding one depth
        s += `\n${this._buildOutputFromInternalStructure(value, depth + 1)}`;
      } else {
        // Otherwise it's a primitive type/string
        // By default values do not have a delimiter
        let delimiter = '';
        // If the value is a string
        if (typeof value === 'string') {
          // Then we need the " delimiter
          delimiter = '"';
        }
        // Write the value
        s += ` ${delimiter}${value}${delimiter}\n`;
      }
    }
    return s;
  }

  public toYaml(): string {
    if (!this._internalStructure) {
      throw new Error('Output of conversion is empty! Did you call convert() method?');
    }
    
    return this._buildOutputFromInternalStructure(this._internalStructure);
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
