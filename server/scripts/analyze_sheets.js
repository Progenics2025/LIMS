import path from "path";
import fs from "fs";
import xlsx from "xlsx";

function analyzeSheets() {
  const dir = path.resolve(process.cwd(), "sharepoint sheets");
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('.~lock'));
  
  const analysis = {
    files: [],
    allColumns: new Set(),
    columnMappings: {},
    recommendations: []
  };

  for (const file of files) {
    try {
      const fullPath = path.join(dir, file);
      const wb = xlsx.readFile(fullPath, { cellDates: true });
      
      const fileAnalysis = {
        fileName: file,
        sheets: [],
        totalRows: 0,
        sampleData: []
      };

      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(ws, { defval: null });
        const headers = Object.keys(jsonData[0] || {});
        
        headers.forEach(h => analysis.allColumns.add(h));
        
        fileAnalysis.sheets.push({
          name: sheetName,
          headers,
          rowCount: jsonData.length,
          sampleRows: jsonData.slice(0, 3)
        });
        
        fileAnalysis.totalRows += jsonData.length;
        fileAnalysis.sampleData.push(...jsonData.slice(0, 2));
      }
      
      analysis.files.push(fileAnalysis);
      
      // Categorize files based on content
      if (file.toLowerCase().includes('lead')) {
        analysis.columnMappings[file] = 'leads';
      } else if (file.toLowerCase().includes('lab') && file.toLowerCase().includes('process')) {
        analysis.columnMappings[file] = 'lab_processing';
      } else if (file.toLowerCase().includes('finance')) {
        analysis.columnMappings[file] = 'finance';
      } else if (file.toLowerCase().includes('report')) {
        analysis.columnMappings[file] = 'reports';
      } else if (file.toLowerCase().includes('sample')) {
        analysis.columnMappings[file] = 'samples';
      } else if (file.toLowerCase().includes('pricelist')) {
        analysis.columnMappings[file] = 'pricing';
      } else if (file.toLowerCase().includes('logistics')) {
        analysis.columnMappings[file] = 'logistics';
      } else if (file.toLowerCase().includes('sales')) {
        analysis.columnMappings[file] = 'sales';
      } else if (file.toLowerCase().includes('client')) {
        analysis.columnMappings[file] = 'clients';
      }
      
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error.message);
    }
  }

  // Generate schema recommendations
  analysis.recommendations = generateSchemaRecommendations(analysis);
  
  return analysis;
}

function generateSchemaRecommendations(analysis) {
  const recommendations = [];
  
  // Analyze all unique columns
  const columns = Array.from(analysis.allColumns);
  
  // Group related columns
  const leadColumns = columns.filter(c => 
    c.toLowerCase().includes('lead') || 
    c.toLowerCase().includes('client') || 
    c.toLowerCase().includes('organization') ||
    c.toLowerCase().includes('doctor') ||
    c.toLowerCase().includes('referral')
  );
  
  const sampleColumns = columns.filter(c => 
    c.toLowerCase().includes('sample') || 
    c.toLowerCase().includes('specimen') ||
    c.toLowerCase().includes('test') ||
    c.toLowerCase().includes('panel')
  );
  
  const labColumns = columns.filter(c => 
    c.toLowerCase().includes('lab') || 
    c.toLowerCase().includes('processing') ||
    c.toLowerCase().includes('qc') ||
    c.toLowerCase().includes('dna') ||
    c.toLowerCase().includes('rna') ||
    c.toLowerCase().includes('sequencing')
  );
  
  const financeColumns = columns.filter(c => 
    c.toLowerCase().includes('amount') || 
    c.toLowerCase().includes('price') ||
    c.toLowerCase().includes('cost') ||
    c.toLowerCase().includes('payment') ||
    c.toLowerCase().includes('revenue')
  );
  
  const logisticsColumns = columns.filter(c => 
    c.toLowerCase().includes('courier') || 
    c.toLowerCase().includes('shipping') ||
    c.toLowerCase().includes('tracking') ||
    c.toLowerCase().includes('pickup') ||
    c.toLowerCase().includes('delivery')
  );
  
  recommendations.push({
    type: 'leads',
    columns: leadColumns,
    suggestedTable: 'leads_enhanced'
  });
  
  recommendations.push({
    type: 'samples',
    columns: sampleColumns,
    suggestedTable: 'samples_enhanced'
  });
  
  recommendations.push({
    type: 'lab_processing',
    columns: labColumns,
    suggestedTable: 'lab_processing_enhanced'
  });
  
  recommendations.push({
    type: 'finance',
    columns: financeColumns,
    suggestedTable: 'finance_records'
  });
  
  recommendations.push({
    type: 'logistics',
    columns: logisticsColumns,
    suggestedTable: 'logistics_tracking'
  });
  
  return recommendations;
}

const result = analyzeSheets();
console.log(JSON.stringify(result, null, 2));
