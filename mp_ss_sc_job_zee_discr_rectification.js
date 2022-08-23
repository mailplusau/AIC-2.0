/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Module Description
 * 
 * @Last Modified by:   Sruti Desai
 * 
 */

define(['N/runtime', 'N/search', 'N/record', 'N/log', 'N/task', 'N/currentRecord', 'N/format', 'N/email'],
    function(runtime, search, record, log, task, currentRecord, format, email) {
        var zee = 0;
        var role = runtime.getCurrentUser().role;

        var usage_threshold = 50;
        var adhoc_deploy = 'customdeploy2';
        var prev_deploy = null;

        function main() {
            var ctx = runtime.getCurrentScript();

            if (!isNullorEmpty(ctx.getParameter({name: 'custscript_prev_zee_discr_deployment'})) && (adhoc_deploy != ctx.getParameter({name: 'custscript_prev_zee_discr_deployment'})) ) {
                prev_deploy = ctx.getParameter({name: 'custscript_prev_zee_discr_deployment'});
            } else {
                prev_deploy = ctx.deploymentId;
            }
        
            var searched_jobs = search.load({
                id: 'customsearch_job_inv_review_zee_discr',
                type: 'customrecord_job'
            })

            var resultSet = searched_jobs.run();
            var usage_start = ctx.getRemainingUsage();

            log.emergency({
                title: 'START -->',
                details: usage_start
            });
            var count_loop = 0;
            
            resultSet.each(function(result){
                var usage_loopstart = ctx.getRemainingUsage();
                var cust_id = result.getValue({ name: 'internalid', join: 'custrecord_job_customer'});
                var cust_zee = result.getValue({ name: 'partner',join: 'custrecord_job_customer'});
                var job_id = result.getValue('internalid');
                var jobgroup_id = result.getValue('custrecord_job_group');
                var jobgroup_zee = result.getValue({ name: 'custrecord_jobgroup_franchisee',join: 'custrecord_job_group'});
                var job_zee = result.getValue('custrecord_job_franchisee');
                var service_id = result.getValue('custrecord_job_service');
                var service_zee = result.getValue({ name: 'custrecord_service_franchisee',join: 'custrecord_job_service'});
                var joboperatorassigned_id = result.getValue('custrecord_job_operator_assigned');
                var job_source = result.getValue('custrecord_job_source');
                
                if (usage_loopstart <= usage_threshold) {

                    var params = {
                        custscript_prev_zee_discr_deployment: ctx.deploymentId
                    }
        
                    var reschedule = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: prev_deploy,
                        deploymentId: adhoc_deploy,
                        params: params
                    });
                    
                    reschedule.submit();
                    if (reschedule == false) {
                        return false;
                    }

                }
        
                count_loop++;
                /* Customer Zee can be different to Job once Transferred
                if (cust_zee != job_zee) {
                    //set job_zee to cust_zee
                    nlapiLogExecution('DEBUG', '!= job_zee', "cust_zee: " + cust_zee + " vs job_zee: " + job_zee);
                    rectify('customrecord_job', job_id,'custrecord_job_franchisee', cust_zee, joboperatorassigned_id);
                }
                
                if (cust_zee != jobgroup_zee && !isNullorEmpty(jobgroup_zee)) {
                    //set jobgroup_zee to cust_zee
                    nlapiLogExecution('DEBUG', '!= jobgroup_zee', "cust_zee: " + cust_zee + " vs jobgroup_zee: " + jobgroup_zee);
                    rectify('customrecord_jobgroup', jobgroup_id, 'custrecord_jobgroup_franchisee', cust_zee, null);	
                }

                if (cust_zee != service_zee && !isNullorEmpty(service_zee)) {
                    //send alert email to WS & AR
                    nlapiLogExecution('DEBUG', '!= service_zee', "cust_zee: " + cust_zee + " vs service_zee: " + service_zee);
                    var cust = nlapiLoadRecord('customer', cust_id);
                    var service = nlapiLoadRecord ('customrecord_service',service_id);

                    var subject = "Invoicing Review Discrepancy: Service Zee != Customer Zee";

                    var message ="";
                    message += "Customer: " +  cust.getFieldValue('companyname') + " " + cust.getFieldValue('entityid') +"\n";
                    message += "Customer Internal ID: " +  cust_id +"\n";
                    message += "Customer Zee: " + cust_zee +"\n\n";
                    message += "----------------------------------------------------------------------------------\n\n"
                    message += "Service: " +  service.getFieldValue('name') + " " + service.getFieldValue('custrecord_service_price') + " | " + service.getFieldValue ('custrecord_service_description') +"\n";
                    message += "Service Internal ID: " +  service_id +"\n";
                    message += "Service Zee: " +  service_zee +"\n";
                    
                    nlapiSendEmail(58097, 58097, subject, message);

                }
                */

                if (isNullorEmpty(service_zee)) {
                    //send error email: services needs to have service_zee
                    log.debug({
                        title: 'service_zee == null',
                        details: "service_zee: " + service_zee
                    });
                    
                    var service = record.load({
                        type: 'customrecord_service',
                        id: service_id,
                    })

                    var subject = "Job Franchisee Discrepancy Recitfication: Service Zee == null";
        
                    var message ="ALL non-Extra Services should have Service Zee.</br></br></br>";
                    message += "Script: Job Franchisee Discrepancy Recitfication</br>";
                    message += "<a href ='https://system.na2.netsuite.com/app/common/scripting/script.nl?id=709'> View Script </a></br>";
                    message += "----------------------------------------------------------------------------------</br>";
                    message += "Service: " +  service.getValue({ fieldId: 'name' }) + " " + service.getValue({ fieldId: 'custrecord_service_price' }) + " | " + service.getValue({ fieldId: 'custrecord_service_description' }) +"</br>";
                    message += "Service Internal ID: " +  service_id +"</br>";
                    message += "Service Zee: " +  service_zee +"</br>";
                    message += "<a href='https://system.na2.netsuite.com/app/common/custom/custrecordentry.nl?rectype=946&id="+ service_id+"'> View Record </a>"
                    
                    email.send({
                        author: 58097,
                        body: message,
                        recipients: 58097,
                        subject: subject,
                    });
        
                } else if (isNullorEmpty (jobgroup_zee) && job_source != 5) {
                    //send error email: jobgroup needs to have jobgroup_zee
                    log.debug({
                        title: 'jobgroup_zee == null',
                        details: "jobgroup_zee: " + jobgroup_zee
                    });
                            
                    var subject = "Job Franchisee Discrepancy Recitfication: Job Group Zee == null";
        
                    var message ="ALL Job Groups should have Job Group Zee.</br></br></br>";
                    message += "Script: Job Franchisee Discrepancy Recitfication</br>";
                    message += "<a href ='https://system.na2.netsuite.com/app/common/scripting/script.nl?id=709'> View Script </a></br>";
                    message += "----------------------------------------------------------------------------------</br>";
                    message += "Job Group Internal ID: " +  jobgroup_id +"</br>";
                    message += "<a href='https://system.na2.netsuite.com/app/common/custom/custrecordentry.nl?rectype=958&id="+ jobgroup_id +"'> View Record </a>";
                    
                    email.send({
                        author: 58097,
                        body: message,
                        recipients: 58097,
                        subject: subject,
                    });
        
                }  else {

                    if (service_zee != job_zee) {
                        //set job_zee to cust_zee
                        log.debug({
                            title: '!= job_zee',
                            details: "service_zee: " + service_zee + " vs job_zee: " + job_zee
                        })

                        rectify('customrecord_job', job_id,'custrecord_job_franchisee', service_zee, joboperatorassigned_id);
                    }
        
                    if (service_zee != jobgroup_zee){
                        //set jobgroup_zee to service_zee
                        log.debug({
                            title: 'service_zee != jobgroup_zee',
                            details: "service_zee: " + service_zee + " vs jobgroup_zee: " + jobgroup_zee
                        })

                        rectify('customrecord_jobgroup', jobgroup_id, 'custrecord_jobgroup_franchisee', service_zee, null);	
                    }
        
                }

                log.audit({
                    title: 'Loop: '+ count_loop + " | job: " + job_id + " | grp: " + jobgroup_id + ".",
                    details: (usage_loopstart - ctx.getRemainingUsage())
                });

                
		        return true;

            });

            log.emergency({
                title:  '--> END',
                details: usage_start - ctx.getRemainingUsage()
            });

            

        }

        function rectify(recordType, id, field, value, operator){

            var record = record.load({
                type: recordType,
                id: id,
            });
        
            record.setValue({ fieldId: field, value: value});
            if (operator) {
                record.setValue({ fieldId: 'custrecord_job_operator_assigned', value: operator });
            }
        
            log.debug({
                title: 'rectify -> ' + recordType,
                details: "id: " + id + " | field: " + field + " | value: " + value + " | operator: " + operator
            })
        
            record.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        
            return true;
        
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        return {
            execute: main
        }
    }
);