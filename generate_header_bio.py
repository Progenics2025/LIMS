import re

content = """
                      {columnPrefs.isColumnVisible('uniqueId') && <TableHead className="whitespace-nowrap font-semibold sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px]">Unique ID</TableHead>}
                      {columnPrefs.isColumnVisible('projectId') && <TableHead className="whitespace-nowrap font-semibold sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID</TableHead>}
                      {columnPrefs.isColumnVisible('sampleId') && <TableHead className="whitespace-nowrap font-semibold">Sample ID</TableHead>}
                      {columnPrefs.isColumnVisible('clientId') && <TableHead className="whitespace-nowrap font-semibold">Client ID</TableHead>}
                      {columnPrefs.isColumnVisible('organisationHospital') && <TableHead className="whitespace-nowrap font-semibold">Organisation/Hospital</TableHead>}
                      {columnPrefs.isColumnVisible('clinicianResearcherName') && <TableHead className="whitespace-nowrap font-semibold">Clinician/Researcher name</TableHead>}
                      {columnPrefs.isColumnVisible('patientClientName') && <TableHead className="whitespace-nowrap font-semibold">Patient/Client name</TableHead>}
                      {columnPrefs.isColumnVisible('age') && <TableHead className="whitespace-nowrap font-semibold">Age</TableHead>}
                      {columnPrefs.isColumnVisible('gender') && <TableHead className="whitespace-nowrap font-semibold">Gender</TableHead>}
                      {columnPrefs.isColumnVisible('serviceName') && <TableHead className="whitespace-nowrap font-semibold">Service name</TableHead>}
                      {columnPrefs.isColumnVisible('noOfSamples') && <TableHead className="whitespace-nowrap font-semibold">No of Samples</TableHead>}
                      {columnPrefs.isColumnVisible('sequencingStatus') && <TableHead className="whitespace-nowrap font-semibold">Sequencing status</TableHead>}
                      {columnPrefs.isColumnVisible('sequencingDataStorageDate') && <TableHead className="whitespace-nowrap font-semibold">Sequencing data storage date</TableHead>}
                      {columnPrefs.isColumnVisible('basecalling') && <TableHead className="whitespace-nowrap font-semibold">Basecalling</TableHead>}
                      {columnPrefs.isColumnVisible('basecallingDataStorageDate') && <TableHead className="whitespace-nowrap font-semibold">Basecalling data storage date</TableHead>}
                      {columnPrefs.isColumnVisible('workflowType') && <TableHead className="whitespace-nowrap font-semibold">Workflow type</TableHead>}
                      {columnPrefs.isColumnVisible('analysisStatus') && <TableHead className="whitespace-nowrap font-semibold">Analysis status</TableHead>}
                      {columnPrefs.isColumnVisible('analysisDate') && <TableHead className="whitespace-nowrap font-semibold">Analysis date</TableHead>}
                      {columnPrefs.isColumnVisible('thirdPartyName') && <TableHead className="whitespace-nowrap font-semibold">Third party Name</TableHead>}
                      {columnPrefs.isColumnVisible('sampleSentToThirdPartyDate') && <TableHead className="whitespace-nowrap font-semibold">Sample sent to third party Date</TableHead>}
                      {columnPrefs.isColumnVisible('thirdPartyTrf') && <TableHead className="whitespace-nowrap font-semibold">Third party TRF</TableHead>}
                      {columnPrefs.isColumnVisible('resultsRawDataReceivedDate') && <TableHead className="whitespace-nowrap font-semibold">Results/Raw data received date</TableHead>}
                      {columnPrefs.isColumnVisible('thirdPartyReport') && <TableHead className="whitespace-nowrap font-semibold">Third party report</TableHead>}
                      {columnPrefs.isColumnVisible('tat') && <TableHead className="whitespace-nowrap font-semibold">TAT</TableHead>}
                      {columnPrefs.isColumnVisible('vcfFileLink') && <TableHead className="whitespace-nowrap font-semibold">VCF file link</TableHead>}
                      {columnPrefs.isColumnVisible('cnvStatus') && <TableHead className="whitespace-nowrap font-semibold">CNV status</TableHead>}
                      {columnPrefs.isColumnVisible('progenicsRawData') && <TableHead className="whitespace-nowrap font-semibold">Progenics raw data</TableHead>}
                      {columnPrefs.isColumnVisible('progenicsRawDataSize') && <TableHead className="whitespace-nowrap font-semibold">Progenics raw data size</TableHead>}
                      {columnPrefs.isColumnVisible('progenicsRawDataLink') && <TableHead className="whitespace-nowrap font-semibold">Progenics raw data link</TableHead>}
                      {columnPrefs.isColumnVisible('analysisHtmlLink') && <TableHead className="whitespace-nowrap font-semibold">Analysis HTML link</TableHead>}
                      {columnPrefs.isColumnVisible('relativeAbundanceSheet') && <TableHead className="whitespace-nowrap font-semibold">Relative abundance sheet</TableHead>}
                      {columnPrefs.isColumnVisible('dataAnalysisSheet') && <TableHead className="whitespace-nowrap font-semibold">Data analysis sheet</TableHead>}
                      {columnPrefs.isColumnVisible('databaseToolsInformation') && <TableHead className="whitespace-nowrap font-semibold">Database/Tools information</TableHead>}
                      {columnPrefs.isColumnVisible('alertToTechnicalLead') && <TableHead className="whitespace-nowrap font-semibold">Alert to Technical lead</TableHead>}
                      {columnPrefs.isColumnVisible('alertToReportTeam') && <TableHead className="whitespace-nowrap font-semibold">Alert to Report team</TableHead>}
                      {columnPrefs.isColumnVisible('createdAt') && <TableHead className="whitespace-nowrap font-semibold">Created at</TableHead>}
                      {columnPrefs.isColumnVisible('createdBy') && <TableHead className="whitespace-nowrap font-semibold">Created by</TableHead>}
                      {columnPrefs.isColumnVisible('modifiedAt') && <TableHead className="whitespace-nowrap font-semibold">Modified at</TableHead>}
                      {columnPrefs.isColumnVisible('modifiedBy') && <TableHead className="whitespace-nowrap font-semibold">Modified by</TableHead>}
                      {columnPrefs.isColumnVisible('remarkComment') && <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>}
                      {columnPrefs.isColumnVisible('actions') && <TableHead className="sticky right-0 z-40 whitespace-nowrap font-semibold bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 actions-column">Actions</TableHead>}
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
        line = line.replace('<TableHead className="', f'<TableHead onClick={{() => {{ setSortKey(\'{key}\'); setSortDir(s => s === \'asc\' ? \'desc\' : \'asc\'); }}}} className="cursor-pointer ')
        
        # Add sort indicator before </TableHead>
        line = line.replace('</TableHead>', f'{{sortKey === \'{key}\' ? (sortDir === \'asc\' ? \' ▲\' : \' ▼\') : \'\'}}</TableHead>')
        
        print(line)
    else:
        print(line)
