'use strict';

async function loadAndParseCSV(link, fileType, output, callback = () => {}, retryCount = 999, retryDelay = 1000) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await fetch(link);

      if (response.ok) {
        const type = response.headers.get('Content-Type');
        if (type && type.includes(fileType)) {
          const text = await response.text();
          parseCSV(text, output, callback);
          return;
        } else {
          throw new Error(`Unexpected content type: ${type}`);
        }
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} to load ${link} failed:`, error);

      if (attempt < retryCount - 1) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(`Failed to load ${link} after ${retryCount} attempts`, { cause: error });
      }
    }
  }

  function parseCSV(text, output, callback) {
    const lines = text.split('\n');
  
    lines.forEach((line) => {
      line = line.trim();
  
      if (line.length === 0) return;
  
      const skipIndexes = {};
      const columns = line.split(',');
  
      output.push(
        columns.reduce((result, item, index) => {
          if (skipIndexes[index]) return result;
  
          if (item?.startsWith('"') && !item?.endsWith('"')) {
            while (!columns[index + 1].endsWith('"')) {
              index++;
              item += `,${columns[index]}`;
              skipIndexes[index] = true;
            }
  
            index++;
            skipIndexes[index] = true;
            item += `,${columns[index]}`;
          }
  
          result.push(item);
          return result;
        }, []),
      );
    });
  
    callback();
  }
}

function getData(data, text, desiredId = 'NAME', titleId = 'ID', startRow = 1) {
  let titleIdIndex = data[0]?.findIndex((el) => el.toUpperCase() === titleId.toUpperCase());
  if (titleIdIndex === -1) titleIdIndex = 0;
  
  let desireIdIndex = data[0]?.findIndex((el) => el.toUpperCase() === desiredId.toUpperCase());
  if (desireIdIndex === -1) return null;

  for (let i = startRow; i < data.length; i++) {
    if (data[i][titleIdIndex].toUpperCase() === text.toUpperCase()) {
      return data[i][desireIdIndex];
    }
  }

  return null;
}

function parseNumber(str) {
  if (str === null || str === undefined) {
    return 0;
  }
  str = str.replace(/\s/g, '');
  str = str.replace(/,/g, '.');
  str = str.replace(/"/g, '');
  str = str.replace(/ /g, '');
  const number = parseFloat(str);
  if (isNaN(number)) return 0;

  return number;
}

/* --------------------------------- */

export {
  loadAndParseCSV,
  getData,
  parseNumber,
};
