/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Module Description: Schedule Script to empty the Special Customer Field in the App Job Record. Uses Search AIC - AUDIT - Empty App Job Special Customer to get the list of App Jobs.
 * 
 * @Last Modified by:   Sruti Desai
 * 
 */

define(['N/runtime', 'N/search', 'N/record', 'N/log', 'N/task', 'N/currentRecord', 'N/format'],
    function(runtime, search, record, log, task, currentRecord, format) {
        var zee = 0;
        var role = runtime.getCurrentUser().role;

        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://system.sandbox.netsuite.com';
        }
        function main() {
            var searched_summary = search.load({
                id: 'customsearch_emtpy_app_job_special_cust',
                type: 'customrecord_job'
            });

            var resultSet_summary = searched_summary.run();
    
    
            resultSet_summary.each(function(searchResult_summary) {
    
                var job_id = searchResult_summary.getValue('internalid');
    
                var job_record = record.load({
                    type: 'customrecord_job',
                    id: job_id,
                });

                job_record.setValue({ fieldId: 'custrecord_job_special_customer', value: null });
                job_record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
    
                return true;
            });
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }
        
        return {
            execute: main
        }
    }
);