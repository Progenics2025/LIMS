import re

content = """
                    {nutritionColumnPrefs.isColumnVisible('uniqueId') && <th className="min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold sticky left-0 z-40 bg-gray-50 dark:bg-gray-800 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID</th>}
                    {nutritionColumnPrefs.isColumnVisible('projectId') && <th className="min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold sticky left-[120px] z-40 bg-gray-50 dark:bg-gray-800 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID</th>}
                    {nutritionColumnPrefs.isColumnVisible('sampleId') && <th className="min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold">Sample ID</th>}
                    {nutritionColumnPrefs.isColumnVisible('serviceName') && <th className="min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Service name</th>}
                    {nutritionColumnPrefs.isColumnVisible('patientClientName') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Patient/Client name</th>}
                    {nutritionColumnPrefs.isColumnVisible('age') && <th className="min-w-[80px] px-4 py-1 text-left whitespace-nowrap font-semibold">Age</th>}
                    {nutritionColumnPrefs.isColumnVisible('gender') && <th className="min-w-[100px] px-4 py-1 text-left whitespace-nowrap font-semibold">Gender</th>}
                    {nutritionColumnPrefs.isColumnVisible('progenicsTrf') && <th className="min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold">Progenics TRF</th>}
                    {nutritionColumnPrefs.isColumnVisible('questionnaire') && <th className="min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Questionnaire</th>}
                    {nutritionColumnPrefs.isColumnVisible('questionnaireCallRecording') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Questionnaire Call recording</th>}
                    {nutritionColumnPrefs.isColumnVisible('dataAnalysisSheet') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Data analysis sheet</th>}
                    {nutritionColumnPrefs.isColumnVisible('progenicsReport') && <th className="min-w-[140px] px-4 py-1 text-left whitespace-nowrap font-semibold">Progenics Report</th>}
                    {nutritionColumnPrefs.isColumnVisible('nutritionChart') && <th className="min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Nutrition Chart</th>}
                    {nutritionColumnPrefs.isColumnVisible('counsellingSessionDate') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Counselling session date</th>}
                    {nutritionColumnPrefs.isColumnVisible('furtherCounsellingRequired') && <th className="min-w-[160px] px-4 py-1 text-left whitespace-nowrap font-semibold">Further counselling required</th>}
                    {nutritionColumnPrefs.isColumnVisible('counsellingStatus') && <th className="min-w-[140px] px-4 py-1 text-left whitespace-nowrap font-semibold">Counselling status</th>}
                    {nutritionColumnPrefs.isColumnVisible('counsellingSessionRecording') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Counselling session recording</th>}
                    {nutritionColumnPrefs.isColumnVisible('alertToTechnicalLead') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Alert to Technical lead</th>}
                    {nutritionColumnPrefs.isColumnVisible('alertToReportTeam') && <th className="min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Alert to Report team</th>}
                    {nutritionColumnPrefs.isColumnVisible('createdAt') && <th className="min-w-[140px] px-4 py-1 text-left whitespace-nowrap font-semibold">Created at</th>}
                    {nutritionColumnPrefs.isColumnVisible('createdBy') && <th className="min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Created by</th>}
                    {nutritionColumnPrefs.isColumnVisible('modifiedAt') && <th className="min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Modified at</th>}
                    {nutritionColumnPrefs.isColumnVisible('modifiedBy') && <th className="min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Modified by</th>}
                    {nutritionColumnPrefs.isColumnVisible('remarksComment') && <th className="min-w-[200px] px-4 py-1 text-left whitespace-nowrap font-semibold">Remark/Comment</th>}
                    {nutritionColumnPrefs.isColumnVisible('actions') && <th className="sticky right-0 z-40 bg-gray-50 dark:bg-gray-800 px-4 py-1 text-left whitespace-nowrap font-semibold min-w-[100px] border-l-2 actions-column">Actions</th>}
"""

lines = content.strip().split('\n')
for line in lines:
    # Extract key from isColumnVisible('key')
    match = re.search(r"isColumnVisible\('([^']+)'\)", line)
    if match:
        key = match.group(1)
        if key == 'actions':
             print(line)
             continue
        
        # Add onClick and cursor-pointer
        # Add sort indicator
        
        # Insert onClick before className
        line = line.replace('<th className="', f'<th onClick={{() => {{ setSortKey(\'{key}\'); setSortDir(s => s === \'asc\' ? \'desc\' : \'asc\'); }}}} className="cursor-pointer ')
        
        # Add sort indicator before </th>
        line = line.replace('</th>', f'{{sortKey === \'{key}\' ? (sortDir === \'asc\' ? \' ▲\' : \' ▼\') : \'\'}}</th>')
        
        print(line)
    else:
        print(line)
