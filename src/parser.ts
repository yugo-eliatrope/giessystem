type ParsedData = string | {
  temperature: number;
  humidity: number;
};

export const parseSerialData = (data: Buffer): ParsedData => {
  const str = data.toString().replace(/\r|\n|\s/g, '');
  if (str.startsWith('t:')) {
    const [temp, hum] = str.split(',');
    return {
      temperature: Number.parseFloat(temp.split(':')[1]),
      humidity: Number.parseFloat(hum.split(':')[1])
    };
  }
  return str;
};
