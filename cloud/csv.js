/**
 * Converts multidimensional array to CSV
 * 
 * @returns string
 */
(function(ctx){
    
    function convertToRow(arr) {
        var i, item;
        var line = [];

        for (i = 0; i < arr.length; ++i) {
            item = arr[i];
            if (item !== null && typeof item === 'object') {
                item = item.toString();
            }
            if (typeof item === 'string' && (item.indexOf(',') !== -1 || item.indexOf('"') !== -1)) {
                item = '"' + item.replace(/"/g, '""') + '"';
            }
            line.push(item);
        }
        
        return line.join(',');
    }
    
    function convertToCsvFile(multiArr) {
        var i, row;
        var lines = [];
        
        for (i = 0; i < multiArr.length; ++i) {
            row = convertToRow(multiArr[i]);
            lines.push(row);
        }
        
        return lines.join("\r\n");
    }
    
    ctx.convertToCsvFile = convertToCsvFile;
    
}(exports));
