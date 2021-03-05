/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Module Description: Allocate Jobs to Pre defined packages setup by the Zees        
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

        /*
	    Global Variables
        */
        var ctx = runtime.getCurrentScript();
        var usageThreshold = 100;
        // var usageThreshold = 9800;
        var adhocInvDeploy = 'customdeploy2';
        var prevInvDeploy = null;
        var reschedulePerVisit = true;
        var reschedulePerDay = true;
        var rescheduleMonthly = true;
        var rescheduleJobPackageAllocator = true;
        var rescheduleJobAllocator = true;
        var invoiceable_check = false;

        function main() {
            var ctx = runtime.getCurrentScript();

            log.debug({
                title: 'ALL START --> ',
                details: ctx.getRemainingUsage()
            });
        
            // if () {
        
            var service_ids_array = [];
        
            /**
             * Job - Package Allocator (Customer)
             */
            var searched_jobs = search.load({
                id: 'customsearch_job_invoicing_allocator_cus',
                type: 'customrecord_job'
            })
        
            var resultSet = searched_jobs.run();
        
            if (!isNullorEmpty(ctx.getParameter({name: 'custscript_prev_deploy_id'}))) {
                prevInvDeploy = ctx.getParameter({name: 'custscript_prev_deploy_id'});
            } else {
                prevInvDeploy = ctx.deploymentId;
            }
        
            var count_customer = 0;

            /**
             * [description] - Search result run based on the customer
             */
            resultSet.each(function(searchResult) {

                var usageStartCustomer = ctx.getRemainingUsage();

                var result = rescheduleSC(usageStartCustomer);

                //If the threshold to switch isnt met

                if (result != false) {

                    var customer_id = searchResult.getValue({ name:'custrecord_job_customer', join: null, summary: search.Summary.GROUP });

                    /*
                    To check if the Job - Invoicing Review - Invoiceable Discrepancies search for the customer, if present do not run the allocator
                    */
                    var searched_job_group_inv_review_descp = search.load({
                        id: 'customsearch_job_inv_review_inv_discrep',
                        type: 'customrecord_job'
                    });

                    searched_job_group_inv_review_descp.filters.push(search.createFilter({
                        name: 'custrecord_job_customer',
                        operator: search.Operator.IS,
                        values: customer_id,
                    }));
                    
                    var resultSet_job_group_inv_review_descp = searched_job_group_inv_review_descp.run();

                    var result_job_group_inv_review_descp = resultSet_job_group_inv_review_descp.getRange({
                        start: 0,
                        end: 1
                    });

                    /*
                        If Empty and result is 0, then the package allocator runs
                    */

                    if (result_job_group_inv_review_descp.length == 0) {

                        var customer_text = searchResult.getText({ name: 'custrecord_job_customer', join: null, summary: search.Summary.GROUP });

                        var customer_franchisee = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: customer_id,
                            columns: 'partner'
                        })

                        log.debug({
                            title: 'Start of Customer',
                            details: customer_text + '| Usage: ' + ctx.getRemainingUsage()
                        });

                        /**
                         * Job - Package Allocator - Service Package
                         */
                        var searched_packages = search.load({
                            id: 'customsearch_job_service_package',
                            type: 'customrecord_service_package'
                        });

                        var fil_line = [];

                        searched_packages.filters.push(search.createFilter({
                            name: 'custrecord_service_package_customer',
                            operator: search.Operator.IS,
                            values: customer_id,
                        }));

                        searched_packages.filters.push(search.createFilter({
                            name: 'custrecord_service_package_franchisee',
                            operator: search.Operator.ANYOF,
                            values: customer_franchisee,
                        }));
                        
                        
                        var packageResult = searched_packages.run();

                        var count_package = 0;

                        // [description] - Get all the packages based on the customer
                        packageResult.each(function(searchPackageResult) {

                            var usageStartPackage = ctx.getRemainingUsage();


                            var package_id = searchPackageResult.getValue('internalid');
                            var package_text = searchPackageResult.getValue('name');

                            log.debug({
                                title: 'Start of package loop - ' + package_text + ' for customer  ' + customer_text,
                                details: ctx.getRemainingUsage()
                            })

                            var customer = searchPackageResult.getValue('custrecord_service_package_customer');
                            var franchisee = searchPackageResult.getValue('custrecord_service_package_franchisee');
                            var discount_period = searchPackageResult.getValue('custrecord_service_package_disc_period');
                            var invoice_single_item = searchPackageResult.getValue('custrecord_service_package_inv_one_line');
                            var invoice_incomplete = searchPackageResult.getValue('custrecord_service_package_inv_incomplet');
                            var include_extras = searchPackageResult.getValue('custrecord_service_package_extra_inc');
                            var discount_type = searchPackageResult.getValue('custrecord_service_package_disc_type');
                            var date_effective = searchPackageResult.getValue('custrecord_service_package_date_effectiv');


                            /**
                             * Search to get all the services assigned to the package
                             */
                            var fil_po = [];
                            

                            fil_po[fil_po.length] = search.createFilter({
                                name: 'custrecord_service_package',
                                operator: search.Type.ANYOF,
                                values: package_id,
                            });

                            fil_po[fil_po.length] = search.createFilter({
                                name: 'custrecord_service_franchisee',
                                operator: search.Type.ANYOF,
                                values: customer_franchisee,
                            });
                            
                            var col_po = [];
                            col_po[col_po.length] = search.createColumn({
                                name: 'internalid',
                            });

                            col_po[col_po.length] = search.createColumn({
                                name: 'custrecord_service',
                            });

                            col_po[col_po.length] = search.createColumn({
                                name: 'custrecord_service_price',
                            })

                            col_po[col_po.length] = search.createColumn({
                                name: 'name',
                            });

                            var poSearch = search.create({
                                type: 'customrecord_service',
                                filters: fil_po,
                                columns: col_po,
                            });

                            var service_ids = [];
                            var service_names = [];
                            var job_ids_array = [];
                            var job_group_ids_array = [];
                            var job_groups_list = [];

                            //Get all the services assigned to the package and start initialising the job_group_ids_array	
                            //
                            if (!isNullorEmpty(poSearch)) {
                                for (var i = 0; i < poSearch.length; i++) {
                                    if (poSearch[i].getValue('custrecord_service') != 17) {
                                        service_ids[service_ids.length] = poSearch[i].getValue('internalid');
                                        service_names[service_names.length] = poSearch[i].getValue('name');
                                        job_ids_array[job_ids_array.length] = [];
                                        job_group_ids_array[job_group_ids_array.length] = [];
                                    }

                                }
                            }

                            log.debug({ title: 'service_ids', details: service_ids })

                            if (!isNullorEmpty(service_ids)) {
                                /**
                                 * SWITCH - Based on the Discount Period 
                                 */
                                if (discount_period == 1) {

                                    // Discount Period - Per Visit
                                    log.debug({ title: 'Begining of the Package Switch - PER VISIT: ', details: 'Package:' + package_text + '| Customer: ' + customer_text + ' | Usage: ' + ctx.getRemainingUsage() });

                                    /**
                                     * Job - Package Allocator (Date-Time)
                                     */
                                    var searched_jobs2 = search.load({
                                        id: 'customsearch_job_invoicing_allocator_dt',
                                        type: 'customrecord_job'
                                    });


                                    //Filter for Job - Package Allocator (Date-Time) are customer,serviceids, zee
                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_customer',
                                        operator: search.Operator.IS,
                                        values: customer_id,
                                    }));


                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_service',
                                        operator: search.Operator.ANYOF,
                                        values: service_ids,
                                    }));
                                    
                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_franchisee',
                                        operator: search.Operator.IS,
                                        values: customer_franchisee,
                                    }));
                                    
                                    if (!isNullorEmpty(date_effective)) {
                                        searched_jobs2.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORAFTER,
                                            values: format.parse({ value: date_effective, type: format.Type.DATE }),
                                        }));

                                    }

                                    var resultSet2 = searched_jobs2.run();

                                    var usageStartDateTime = ctx.getRemainingUsage();

                                    var count_date_time = 0;

                                    //To go through all the result for Job - Package Allocator (Date-Time)
                                    resultSet2.each(function(searchResult2) {

                                        var usageStartPerVisit = ctx.getRemainingUsage();

                                        // var resultPerVisit = rescheduleSC(usageStartPerVisit);

                                        if (usageStartPerVisit <= usageThreshold) {

                                            log.debug({
                                                title: 'SWITCHing at Package: ' + package_text + ' - PER VISIT for Customer: ' + customer_text + ' -->',
                                                details: ctx.getRemainingUsage()
                                            })

                                            var params = {
                                                custscript_prev_deploy_id: ctx.deploymentId
                                            }

                                            var reschedulePerVisit = task.create({
                                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                scriptId: prevInvDeploy,
                                                deploymentId: adhocInvDeploy,
                                                params: params
                                            });
                                            
                                            reschedulePerVisit.submit();
                    
                                            
                                            if (reschedulePerVisit == false) {
                                                return false;
                                            }
                                        } else {
                                            log.debug({
                                                title: 'Begining of the Date-Time search loop ',
                                                details: ctx.getRemainingUsage()
                                            })

                                            var date_finalised = searchResult2.getValue({ name: 'custrecord_job_date_finalised', join: null, summary: search.Summary.GROUP });
                                            var time_finalised = searchResult2.getValue({ name: 'custrecord_job_time_finalised', join: null, summary: search.Summary.GROUP });
                                            var count = searchResult2.getValue({ name: 'internalid', join: null, summary: search.Summary.COUNT });


                                            /**
                                             * Job - Package Allocator
                                             */
                                            var searched_jobs3 = search.load({
                                                id: 'customsearch_job_invoicing_allocator',
                                                type: 'customrecord_job'
                                            })

                                            // Filters for Job - Package Allocator are customerid, serviceids, zee,date finalised, time finalised
                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_customer',
                                                operator: search.Operator.IS,
                                                values: customer_id,
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_date_finalised',
                                                operator: search.Operator.ON,
                                                values: format.parse({ value: date_finalised, type: format.Type.DATE }),
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_time_finalised',
                                                operator: search.Operator.EQUALTO,
                                                values: time_finalised,
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_service',
                                                operator: search.Operator.IS,
                                                values: service_ids,
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_franchisee',
                                                operator: search.Operator.IS,
                                                values: customer_franchisee,
                                            }));

                                            if (!isNullorEmpty(date_effective)) {
                                                searched_jobs3.filters.push(search.createFilter({
                                                    name: 'custrecord_job_date_scheduled',
                                                    operator: search.Operator.ONORAFTER,
                                                    values: format.parse({ value: date_effective, type: format.Type.DATE }),
                                                }));
                                                
                                            }
                                            // if (invoice_incomplete == 2) {
                                            // 	newFilters[5] = new nlobjSearchFilter('custrecord_job_status', null, 'is', 3);
                                            // }


                                            var resultSet3 = searched_jobs3.run();

                                            var job_group_status_array = [];
                                            var job_group_invoiceable_array = [];
                                            var result_service_ids = [];
                                            log.debug({ title: 'Start of Creating Job Group ID/Status Array ', details: ctx.getRemainingUsage()})

                                            /**
                                             * To go throught all the results from the Job - Package Allocator and get the Job Group Ids for the related services
                                             */
                                            resultSet3.each(function(searchResult3) {

                                                var job_id = searchResult3.getValue('internalid');
                                                var job_group_id = searchResult3.getValue('custrecord_job_group');
                                                var service_id = searchResult3.getValue('custrecord_job_service');
                                                var service_text = searchResult3.getText('custrecord_job_service');
                                                var job_invoiceable = searchResult3.getValue('custrecord_job_invoiceable');
                                                var job_group_status = searchResult3.getValue({ name: "custrecord_jobgroup_status",join: "CUSTRECORD_JOB_GROUP", summary: null });

                                                log.audit({
                                                    title: 'Job Group ID : ' + job_group_id + ' | Status Array: ' + job_group_status,
                                                    details: ctx.getRemainingUsage()
                                                });

                                                var pos = service_ids.indexOf(service_id);

                                                var len = job_group_ids_array[pos].length;

                                                result_service_ids[result_service_ids.length] = service_id;
                                                job_ids_array[pos][len] = job_id;
                                                job_group_ids_array[pos][len] = job_group_id;
                                                job_group_status_array[job_group_id] = job_group_status;
                                                job_group_invoiceable_array[job_group_id] = job_invoiceable;
                                                return true;
                                            });

                                            result_service_ids = result_service_ids.filter(function(elem, index, self) {
                                                return index == self.indexOf(elem);
                                            });

                                            log.debug({
                                                title: 'End of Creating Job Group ID/Status Array ',
                                                details: ctx.getRemainingUsage()
                                            })

                                            if (service_ids.length == result_service_ids.length) {

                                                log.debug({
                                                    title: 'INSIDE',
                                                    details: 'INSIDE'
                                                })

                                                var unique = [];

                                                for (var i = 0; i < job_group_ids_array.length; i++) {
                                                    unique[i] = [];

                                                    unique[i] = job_group_ids_array[i].filter(function(elem, index, self) {
                                                        return index == self.indexOf(elem);
                                                    });
                                                }


                                                var shortest = unique.reduce(function(p, c) {
                                                    return p.length > c.length ? c : p;
                                                }, {
                                                    length: Infinity
                                                });

                                                // var unique = job_groups_list.filter(function(elem, index, self) {
                                                // 	return index == self.indexOf(elem);
                                                // });
                                                // 
                                                var final_package_status = null;
                                                var final_invoiceable = null;
                                                invoiceable_check = false;

                                                if (shortest.length > 0) {
                                                    for (var y = 0; y < shortest.length; y++) {
                                                        for (var i = 0; i < unique.length; i++) {
                                                            job_groups_list[job_groups_list.length] = unique[i][y];
                                                            var status = job_group_status_array[unique[i][y]];

                                                            var invoiceable = job_group_invoiceable_array[unique[i][y]];

                                                            final_package_status = getPackageStatus(final_package_status, status);
                                                            final_invoiceable = getPackageInvoiceable(final_invoiceable, status, invoiceable);
                                                        }

                                                        job_groups_list.sort(function(a, b) {
                                                            return a - b
                                                        });
                                                        if (!isNullorEmpty(job_groups_list)) {

                                                            log.debug({
                                                                title: 'Start of Allocator Jobs Loop',
                                                                details: ctx.getRemainingUsage()
                                                            })

                                                            // Search: Job - Package Allocator - Unfiltered - DO NOT DELETE
                                                            var searched_jobs4 = search.load({
                                                                id: 'customsearch_job_pkg_allocatr_unfilterd',
                                                                type: 'customrecord_job'
                                                            });

                                                            log.debug({
                                                                title: 'Period Type 1 | Shortest Length > 0 ',
                                                                details: 'job_groups_list: ' + job_groups_list
                                                            });

                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_customer',
                                                                operator: search.Operator.IS,
                                                                values: customer_id,
                                                            }));

                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_group',
                                                                operator: search.Operator.ANYOF,
                                                                values: job_groups_list,
                                                            }));

                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_franchisee',
                                                                operator: search.Operator.IS,
                                                                values: customer_franchisee,
                                                            }));
                                                            
                                                            
                                                            if (include_extras == 2) {
                                                                searched_jobs4.filters.push(search.createFilter({
                                                                    name: 'custrecord_job_service_category',
                                                                    operator: search.Operator.IS,
                                                                    values: 1,
                                                                }));
                                                            }
                                                            if (!isNullorEmpty(date_effective)) {
                                                                searched_jobs4.filters.push(search.createFilter({
                                                                    name: 'custrecord_job_date_scheduled',
                                                                    operator: search.Operator.ONORAFTER,
                                                                    values: format.parse({value: date_effective, type: format.Type.DATE }),
                                                                }));
                                                            }
                                                            // if (invoice_incomplete == 2) {
                                                            // 	newFilters[newFilters.length] = new nlobjSearchFilter('custrecord_job_status', null, 'is', 3);
                                                            // }


                                                            var resultSet4 = searched_jobs4.run();

                                                            var usageStartAllocator = ctx.getRemainingUsage();

                                                            if (usageStartAllocator <= usageThreshold) {

                                                                log.debug({
                                                                    title: 'SWITCHing at -->',
                                                                    details: 'PACKAGE PER DAY - Allocator:' + package_text + ' | Customer: ' + customer_text + ' | Job Group List: ' + job_groups_list + ' | ' + ctx.getRemainingUsage()
                                                                })

                                                                var params = {
                                                                    custscript_prev_deploy_id: ctx.deploymentId
                                                                }

                                                                rescheduleJobPackageAllocator = task.create({
                                                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                                    deploymentId: adhocInvDeploy,
                                                                    params: params,
                                                                    scriptId: prevInvDeploy,
                                                                })

                                                                log.debug({
                                                                    title: 'rescheduleJobPackageAllocator',
                                                                    details: rescheduleJobPackageAllocator
                                                                });       
                                                                
                                                                rescheduleJobPackageAllocator.submit();
                                                                if (rescheduleJobPackageAllocator == false) {
                                                                    return false;
                                                                }
                                                            } else {
                                                                resultSet4.each(function(searchResult4) {


                                                                    var startUsageAllocator = ctx.getRemainingUsage();

                                                                    var job_record = record.load({
                                                                        type: 'customrecord_job',
                                                                        id: searchResult4.getValue('internalid'),
                                                                    });


                                                                    job_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_item });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
                                                                    job_record.setValue({ fieldId: 'custrecord_package_job_groups', value: job_groups_list });
                                                                    job_record.setValue({ fieldId: 'custrecord_package_status', value: final_package_status });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: final_invoiceable });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_date_allocated', value: getDate() });
                                                                    job_record.save({
                                                                        enableSourcing: true,
                                                                        ignoreMandatoryFields: true
                                                                    })

                                                                    log.audit({
                                                                        title: 'PACKAGE PER VISIT - Allocator | Job ID: ' + searchResult4.getValue('internalid'),
                                                                        details: (startUsageAllocator - ctx.getRemainingUsage())
                                                                    });

                                                                    return true;
                                                                });

                                                                log.debug({
                                                                    title: 'End of Allocator Jobs Loop',
                                                                    details: ctx.getRemainingUsage()
                                                                })

                                                                job_groups_list = [];
                                                            }
                                                        } else {
                                                            return true;
                                                        }

                                                    }
                                                } else {
                                                    for (var i = 0; i < unique.length; i++) {
                                                        job_groups_list[job_groups_list.length] = unique[i][0];
                                                        var status = job_group_status_array[unique[i][0]];

                                                        var invoiceable = job_group_invoiceable_array[unique[i][0]];

                                                        final_package_status = getPackageStatus(final_package_status, status);
                                                        final_invoiceable = getPackageInvoiceable(final_invoiceable, status, invoiceable);
                                                    }

                                                    job_groups_list.sort(function(a, b) {
                                                        return a - b
                                                    });

                                                    job_groups_list = cleanArray(job_groups_list)

                                                    if (!isNullorEmpty(job_groups_list)) {


                                                        log.debug({
                                                            title: 'Start of Allocator Jobs Loop',
                                                            details: ctx.getRemainingUsage()
                                                        })

                                                        //Search: Job - Package Allocator - Unfiltered - DO NOT DELETE
                                                        var searched_jobs4 = search.load({
                                                            id: 'customsearch_job_pkg_allocatr_unfilterd',
                                                            type: 'customrecord_job'
                                                        });

                                                        log.debug({
                                                            title: 'Period Type 1 | Shortest Length = 0 ',
                                                            details: 'job_groups_list: ' + job_groups_list
                                                        })

                                                        searched_jobs4.filters.push(search.createFilter({
                                                            name: 'custrecord_job_customer',
                                                           operator: search.Operator.IS,
                                                            values: customer_id,
                                                        }));

                                                        searched_jobs4.filters.push(search.createFilter({
                                                            name: 'custrecord_job_group',
                                                            operator: search.Operator.ANYOF,
                                                            values: job_groups_list,
                                                        }));

                                                        searched_jobs4.filters.push(search.createFilter({
                                                            name: 'custrecord_job_franchisee',
                                                           operator: search.Operator.IS,
                                                            values: customer_franchisee,
                                                        }));

                                                       
                                                        if (include_extras == 2) {
                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_service_category',
                                                               operator: search.Operator.IS,
                                                                values: 1,
                                                            }));

                                                        }
                                                        if (!isNullorEmpty(date_effective)) {
                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_date_scheduled',
                                                               operator: search.Operator.ONORAFTER,
                                                                values: format.parse({value: date_effective, type: format.Type.DATE }),
                                                            }));
                                                        }


                                                        var resultSet4 = searched_jobs4.run();

                                                        var usageStartAllocator = ctx.getRemainingUsage();

                                                        if (usageStartAllocator <= usageThreshold) {

                                                            log.debug({
                                                                title: 'SWITCHing at -->',
                                                                details: 'PACKAGE PER DAY - Allocator:' + package_text + ' | Customer: ' + customer_text + ' | Job Group List: ' + job_groups_list + ' | ' + ctx.getRemainingUsage()
                                                            });

                                                            var params = {
                                                                custscript_prev_deploy_id: ctx.deploymentId
                                                            }

                                                            rescheduleJobPackageAllocator = task.create({
                                                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                                deploymentId: adhocInvDeploy,
                                                                params: params,
                                                                scriptId: prevInvDeploy,
                                                            })
                                                            
                                                            log.debug({
                                                                title: 'rescheduleJobPackageAllocator',
                                                                details: rescheduleJobPackageAllocator
                                                            });

                                                            rescheduleJobPackageAllocator.submit();

                                                            if (rescheduleJobPackageAllocator == false) {
                                                                return false;
                                                            }
                                                        } else {
                                                            resultSet4.each(function(searchResult4) {


                                                                var startUsageAllocator = ctx.getRemainingUsage();

                                                                var job_record = record.load({
                                                                    type: 'customrecord_job',
                                                                    id: searchResult4.getValue('internalid'),
                                                                });

                                                                job_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
                                                                job_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_item });
                                                                job_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
                                                                job_record.setValue({ fieldId: 'custrecord_package_job_groups', value: job_groups_list });
                                                                job_record.setValue({ fieldId: 'custrecord_package_status', value: final_package_status });
                                                                job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: final_invoiceable });
                                                                job_record.setValue({ fieldId: 'custrecord_job_date_allocated', value: getDate() });
                                                                
                                                                job_record.save({
                                                                    enableSourcing: true,
                                                                    ignoreMandatoryFields: true
                                                                });

                                                                log.audit({
                                                                    title: 'PACKAGE PER VISIT - Allocator | Job ID: ' + searchResult4.getValue('internalid'),
                                                                    details: (startUsageAllocator - ctx.getRemainingUsage())
                                                                })

                                                                return true;
                                                            });

                                                            log.debug({
                                                                title: 'End of Allocator Jobs Loop',
                                                                details: ctx.getRemainingUsage()
                                                            })

                                                            job_groups_list = [];
                                                        }
                                                    } else {
                                                        return true;
                                                    }

                                                }

                                                if (rescheduleJobPackageAllocator == false) {
                                                    return false;
                                                } else {
                                                    for (var i = 0; i < job_group_ids_array.length; i++) {
                                                        job_group_ids_array[i] = [];
                                                    }

                                                    count_date_time++;

                                                    log.debug({ title: 'Usage end of (' + count_date_time + ') Date Time loop ', details: 'For Services: ' + service_names + ' | For Pakcgae: ' + package_text + ' | Customer: ' + customer_text + ' | Usage: ' + (usageStartPerVisit - ctx.getRemainingUsage())});

                                                    return true;
                                                }
                                            } else {
                                                return true;
                                            }

                                        }
                                    });

                                    log.debug({ title: 'End of the Date Time search loop ', details: ctx.getRemainingUsage()});

                                } else if (discount_period == 2) {

                                    //Discount Period - per Day
                                    log.debug({ title: 'Begining of the Package Switch - PER DAY: ', details: 'Package:' + package_text + '| Customer: ' + customer_text + ' | Usage: ' + ctx.getRemainingUsage()});

                                    var searched_jobs2 = search.load({
                                        id: 'customsearch_job_invoicing_allocator_d',
                                        type: 'customrecord_job'
                                    })

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_customer',
                                        operator: search.Operator.IS,
                                        values: customer_id,
                                    }));

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecocustrecord_job_servicerd_job_customer',
                                        operator: search.Operator.ANYOF,
                                        values: service_ids,
                                    }));

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_franchisee',
                                        operator: search.Operator.IS,
                                        values: customer_franchisee,
                                    }));

                                   
                                    if (!isNullorEmpty(date_effective)) {
                                        searched_jobs2.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORAFTER,
                                            values: format.parse({value: date_effective, type: format.Type.DATE }),
                                        }));

                                    }
                                    // if (invoice_incomplete == 2) {
                                    // 	newFilters[newFilters.length] = new nlobjSearchFilter('custrecord_job_status', null, 'is', 3);
                                    // }

                                    var resultSet2 = searched_jobs2.run();
                                    var count_date = 0;

                                    resultSet2.each(function(searchResult2) {

                                        // rescheduleSC();
                                        // 
                                        var usageStartPerDay = ctx.getRemainingUsage();

                                        if (usageStartPerDay <= usageThreshold) {

                                            log.debug({
                                                title: 'SWITCHing at Package: ' + package_text + ' - PER DAY for Customer: ' + customer_text + ' -->',
                                                details: ctx.getRemainingUsage()
                                            })

                                            var params = {
                                                custscript_prev_deploy_id: ctx.deploymentId
                                            }

                                            reschedulePerDay = task.create({
                                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                deploymentId: adhocInvDeploy,
                                                params: params,
                                                scriptId: prevInvDeploy,
                                            })

                                            if (reschedulePerDay == false) {
                                                return false;
                                            }
                                        } else {

                                            var date_finalised = searchResult2.getValue({ name: 'custrecord_job_date_finalised', join: null, summary: search.Summary.GROUP });
                                            var count = searchResult2.getValue({ name: 'internalid', join: null, summary: search.Summary.COUNT });


                                            var searched_jobs3 = search.load({
                                                id: 'customsearch_job_invoicing_allocator',
                                                type: 'customrecord_job'
                                            })


                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_customer',
                                                operator: search.Operator.IS,
                                                values: customer_id,
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_date_finalised',
                                                operator: search.Operator.ON,
                                                values: format.parse({ value: date_finalised, type: format.Type.DATE}),
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_service',
                                                operator: search.Operator.IS,
                                                values: service_ids,
                                            }));

                                            searched_jobs3.filters.push(search.createFilter({
                                                name: 'custrecord_job_franchisee',
                                                operator: search.Operator.IS,
                                                values: customer_franchisee,
                                            }));

                                            if (!isNullorEmpty(date_effective)) {
                                                searched_jobs3.filters.push(search.createFilter({
                                                    name: 'custrecord_job_date_scheduled',
                                                    operator: search.Operator.ONORAFTER,
                                                    values: format.parse({ value: date_finalised, type: format.Type.DATE}),
                                                }));

                                            }

                                            var resultSet3 = searched_jobs3.run();

                                            var job_group_status_array = [];
                                            var job_group_invoiceable_array = [];
                                            var result_service_ids = [];

                                            log.debug({
                                                title: 'Creating Job Group ID/Status Array',
                                                details: ctx.getRemainingUsage()
                                            })

                                            resultSet3.each(function(searchResult3) {

                                                var job_id = searchResult3.getValue('internalid');
                                                var job_group_id = searchResult3.getValue('custrecord_job_group');
                                                var service_id = searchResult3.getValue('custrecord_job_service');
                                                var service_text = searchResult3.getText('custrecord_job_service');
                                                var service_text = searchResult3.getText('custrecord_job_service');
                                                var job_invoiceable = searchResult3.getValue('custrecord_job_invoiceable');
                                                var job_group_status = searchResult3.getValue({ name: "custrecord_jobgroup_status", join: "CUSTRECORD_JOB_GROUP" });

                                                log.audit({
                                                    title: 'Job Group ID : ' + job_group_id + ' | Status Array: ' + job_group_status,
                                                    details: ctx.getRemainingUsage()
                                                });

                                                var pos = service_ids.indexOf(service_id);

                                                var len = job_group_ids_array[pos].length;

                                                result_service_ids[result_service_ids.length] = service_id;
                                                job_ids_array[pos][len] = job_id;
                                                job_group_ids_array[pos][len] = job_group_id;
                                                job_group_status_array[job_group_id] = job_group_status;
                                                job_group_invoiceable_array[job_group_id] = job_invoiceable;
                                                return true;
                                            });

                                            log.debug({
                                                title: 'End of creating Job Group ID/Status Array',
                                                details: ctx.getRemainingUsage()
                                            })

                                            result_service_ids = result_service_ids.filter(function(elem, index, self) {
                                                return index == self.indexOf(elem);
                                            });

                                            if (service_ids.length == result_service_ids.length) {

                                                var unique = [];

                                                for (var i = 0; i < job_group_ids_array.length; i++) {
                                                    unique[i] = [];

                                                    unique[i] = job_group_ids_array[i].filter(function(elem, index, self) {
                                                        return index == self.indexOf(elem);
                                                    });
                                                }


                                                var shortest = unique.reduce(function(p, c) {
                                                    return p.length > c.length ? c : p;
                                                }, {
                                                    length: Infinity
                                                });

                                                var final_package_status = null;
                                                var final_invoiceable = null;
                                                invoiceable_check = false;

                                                if (shortest.length > 0) {
                                                    for (var y = 0; y < shortest.length; y++) {
                                                        for (var i = 0; i < unique.length; i++) {
                                                            job_groups_list[job_groups_list.length] = unique[i][y];
                                                            var status = job_group_status_array[unique[i][y]];
                                                            var invoiceable = job_group_invoiceable_array[unique[i][y]];

                                                            final_package_status = getPackageStatus(final_package_status, status);
                                                            final_invoiceable = getPackageInvoiceable(final_invoiceable, status, invoiceable);
                                                        }

                                                        job_groups_list.sort(function(a, b) {
                                                            return a - b
                                                        });

                                                        if (!isNullorEmpty(job_groups_list)) {

                                                            log.debug({
                                                                title: 'Start of Allocator Jobs Loop',
                                                                details: ctx.getRemainingUsage()
                                                            })

                                                            // Search: Job - Package Allocator - Unfiltered - DO NOT DELETE
                                                            var searched_jobs4 = search.load({
                                                                id: 'customsearch_job_pkg_allocatr_unfilterd',
                                                                type: 'customrecord_job'
                                                            });

                                                            log.debug({
                                                                title: 'Period Type 2 | Shortest Length > 0 ',
                                                                details: 'job_groups_list: ' + job_groups_list
                                                            });

                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_customer',
                                                                operator: search.Operator.IS,
                                                                values: customer_id,
                                                            }));

                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_group',
                                                                operator: search.Operator.ANYOF,
                                                                values: job_groups_list,
                                                            }));

                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_franchisee',
                                                                operator: search.Operator.IS,
                                                                values: customer_franchisee,
                                                            }));

                                                            if (include_extras == 2) {
                                                                searched_jobs4.filters.push(search.createFilter({
                                                                    name: 'custrecord_job_service_category',
                                                                    operator: search.Operator.IS,
                                                                    values: 1,
                                                                }));
                                                            }
                                                            if (!isNullorEmpty(date_effective)) {
                                                                searched_jobs4.filters.push(search.createFilter({
                                                                    name: 'custrecord_job_date_scheduled',
                                                                    operator: search.Operator.ONORAFTER,
                                                                    values: format.parse({value: date_effective, type: format.Type.DATE }),
                                                                }));
                                                            }

                                                            var resultSet4 = searched_jobs4.run();

                                                            var usageStartAllocator = ctx.getRemainingUsage();

                                                            if (usageStartAllocator <= usageThreshold) {

                                                                log.debug({
                                                                    title: 'SWITCHing at -->',
                                                                    details: 'PACKAGE PER DAY - Allocator:' + package_text + ' | Customer: ' + customer_text + ' | Job Group List: ' + job_groups_list + ' | ' + ctx.getRemainingUsage()
                                                                });

                                                                var params = {
                                                                    custscript_prev_deploy_id: ctx.deploymentId
                                                                }

                                                                rescheduleJobPackageAllocator = task.create({
                                                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                                    scriptId: prevInvDeploy,
                                                                    deploymentId: adhocInvDeploy,
                                                                    params: params
                                                                });

                                                                rescheduleJobPackageAllocator.submit();

                                                                if (rescheduleJobPackageAllocator == false) {
                                                                    return false;
                                                                }
                                                            } else {
                                                                resultSet4.each(function(searchResult4) {


                                                                    var startUsageAllocator = ctx.getRemainingUsage();


                                                                    var job_record = record.load({
                                                                        type: 'customrecord_job',
                                                                        id: searchResult4.getValue('internalid'),
                                                                    })

                                                                    job_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_item });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
                                                                    job_record.setValue({ fieldId: 'custrecord_package_job_groups value:', job_groups_list });
                                                                    job_record.setValue({ fieldId: 'custrecord_package_status', value: final_package_status });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: final_invoiceable });
                                                                    job_record.setValue({ fieldId: 'custrecord_job_date_allocated', value: getDate() });
                                                                    
                                                                    job_record.save({
                                                                        enableSourcing: true,
                                                                        ignoreMandatoryFields: true
                                                                    });


                                                                    log.audit({
                                                                        title: 'PACKAGE PER DAY - Allocator | Job ID: ' + searchResult4.getValue('internalid'),
                                                                        details: (startUsageAllocator - ctx.getRemainingUsage())
                                                                    });

                                                                    return true;
                                                                });

                                                                log.debug({
                                                                    title: 'End of Allocator Jobs Loop',
                                                                    details: ctx.getRemainingUsage()
                                                                })

                                                                job_groups_list = [];
                                                            }
                                                        } else {
                                                            return true;
                                                        }

                                                    }
                                                } else {
                                                    for (var i = 0; i < unique.length; i++) {
                                                        job_groups_list[job_groups_list.length] = unique[i][0];
                                                        var status = job_group_status_array[unique[i][0]];
                                                        var invoiceable = job_group_invoiceable_array[unique[i][0]];

                                                        final_package_status = getPackageStatus(final_package_status, status);
                                                        final_invoiceable = getPackageInvoiceable(final_invoiceable, status, invoiceable);
                                                    }

                                                    job_groups_list.sort(function(a, b) {
                                                        return a - b
                                                    });

                                                    job_groups_list = cleanArray(job_groups_list);

                                                    if (!isNullorEmpty(job_groups_list)) {

                                                        log.debug({
                                                            title: 'Start of Allocator Jobs Loop',
                                                            details: ctx.getRemainingUsage()
                                                        });

                                                        //Search: Job - Package Allocator - Unfiltered - DO NOT DELETE
                                                        var searched_jobs4 = search.load({
                                                            id: 'customsearch_job_pkg_allocatr_unfilterd',
                                                            type: 'customrecord_job'
                                                        });

                                                        log.debug({
                                                            title: 'Period Type 1 | Shortest Length = 0 ',
                                                            details: 'job_groups_list: ' + job_groups_list
                                                        });

                                                        searched_jobs4.filters.push(search.createFilter({
                                                            name: 'custrecord_job_customer',
                                                            operator: search.Operator.IS,
                                                            values: customer_id,
                                                        }));

                                                        searched_jobs4.filters.push(search.createFilter({
                                                            name: 'custrecord_job_group',
                                                            operator: search.Operator.ANYOF,
                                                            values: job_groups_list,
                                                        }));

                                                        searched_jobs4.filters.push(search.createFilter({
                                                            name: 'custrecord_job_franchisee',
                                                            operator: search.Operator.IS,
                                                            values: customer_franchisee,
                                                        }));



                                                       
                                                        if (include_extras == 2) {
                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_service_category',
                                                                operator: search.Operator.IS,
                                                                values: 1,
                                                            }));

                                                        }
                                                        if (!isNullorEmpty(date_effective)) {
                                                            searched_jobs4.filters.push(search.createFilter({
                                                                name: 'custrecord_job_date_scheduled',
                                                                operator: search.Operator.ONORAFTER,
                                                                values: format.parse({ value: date_effective, type: format.Type.DATE }),
                                                            }));

                                                        }

                                                        var resultSet4 = searched_jobs4.run();

                                                        var usageStartAllocator = ctx.getRemainingUsage();

                                                        if (usageStartAllocator <= usageThreshold) {

                                                            log.debug({
                                                                title: 'SWITCHing at -->',
                                                                details: 'PACKAGE PER DAY - Allocator:' + package_text + ' | Customer: ' + customer_text + ' | Job Group List: ' + job_groups_list + ' | ' + ctx.getRemainingUsage()
                                                            })

                                                            var params = {
                                                                custscript_prev_deploy_id: ctx.deploymentId
                                                            }

                                                            rescheduleJobPackageAllocator = task.create({
                                                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                                scriptId: prevInvDeploy,
                                                                deploymentId: adhocInvDeploy,
                                                                params: params
                                                            });

                                                            rescheduleJobPackageAllocator.submit();

                                                            if (rescheduleJobPackageAllocator == false) {
                                                                return false;
                                                            }
                                                        } else {
                                                            resultSet4.each(function(searchResult4) {


                                                                var startUsageAllocator = ctx.getRemainingUsage();


                                                                var job_record = record.load({
                                                                    type: 'customrecord_job',
                                                                    id: searchResult4.getValue('internalid'),
                                                                });


                                                                job_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
                                                                job_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_item });
                                                                job_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
                                                                job_record.setValue({ fieldId: 'custrecord_package_job_groups', value: job_groups_list });
                                                                job_record.setValue({ fieldId: 'custrecord_package_status', value: final_package_status });
                                                                job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: final_invoiceable });
                                                                job_record.setValue({ fieldId: 'custrecord_job_date_allocated', value: getDate() });
                                                                job_record.save({
                                                                    enableSourcing: true,
                                                                    ignoreMandatoryFields: true
                                                                })


                                                                log.audit({
                                                                    title: 'PACKAGE PER DAY - Allocator | Job ID: ' + searchResult4.getValue('internalid'),
                                                                    details: (startUsageAllocator - ctx.getRemainingUsage())
                                                                })

                                                                return true;
                                                            });

                                                            log.debug({
                                                                title: 'End of Allocator Jobs Loop',
                                                                details: ctx.getRemainingUsage()
                                                            })

                                                            job_groups_list = [];
                                                        }
                                                    } else {
                                                        return true;
                                                    }

                                                }

                                                if (rescheduleJobPackageAllocator == false) {
                                                    return false;
                                                } else {
                                                    for (var i = 0; i < job_group_ids_array.length; i++) {
                                                        job_group_ids_array[i] = [];
                                                    }

                                                    count_date++;
                                                    log.debug({
                                                        title: 'Usage end of (' + count_date + ') Date loop',
                                                        details: 'For Services: ' + service_names + ' | Package: ' + package_text + ' | For Customer: ' + customer_text + ' | Usage: ' + (usageStartPerDay - ctx.getRemainingUsage())
                                                    })

                                                    return true;
                                                }
                                            } else {
                                                return true;
                                            }
                                        }
                                    });

                                    log.debug({
                                        title: 'End of the Date search loop ',
                                        details: ctx.getRemainingUsage()
                                    })
                                } else if (discount_period == 3) {
                                    //Discount Period - Monthly 

                                    log.debug({
                                        title: 'Begining of the Package: ' + package_text + ' - MONTHLY switch for Customer: ' + customer_text,
                                        details: ctx.getRemainingUsage()
                                    })

                                    var date = new Date();

                                    var month = date.getMonth(); //Months 0 - 11
                                    var day = date.getDate();
                                    var year = date.getFullYear();

                                    //If allocator run on the first day of the month, it takes the last month as the filter
                                    if (day == 1) {
                                        if (month == 0) {
                                            month = 11;
                                            year = year - 1
                                        } else {
                                            month = month - 1;
                                        }
                                    }

                                    var firstDay = new Date(year, (month), 1);
                                    var lastDay = new Date(year, (month + 1), 0);



                                    var searched_jobs2 = search.load({
                                        id: 'customsearch_job_invoicing_allocator',
                                        type: 'customrecord_job'
                                    })

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_customer',
                                        operator: search.Operator.IS,
                                        values: customer_id,
                                    }));

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_service',
                                        operator: search.Operator.IS,
                                        values: service_ids,
                                    }));

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_date_finalised',
                                        operator: search.Operator.WITHIN,
                                        values: [firstDay, lastDay],
                                    }));

                                    searched_jobs2.filters.push(search.createFilter({
                                        name: 'custrecord_job_franchisee',
                                        operator: search.Operator.IS,
                                        values: customer_franchisee,
                                    }));

                                    if (include_extras == 2) {
                                        searched_jobs2.filters.push(search.createFilter({
                                            name: 'custrecord_job_service_category',
                                            operator: search.Operator.IS,
                                            values: 1,
                                        }));
                                    }
                                    if (!isNullorEmpty(date_effective)) {
                                        searched_jobs2.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORAFTER,
                                            values: format.parse({value: date_effective, type: format.Type.DATE }),
                                        }));

                                    }

                                    var resultSet2 = searched_jobs2.run();

                                    resultSet2.each(function(searchResult2) {

                                        var usageStartMonthly = ctx.getRemainingUsage();

                                        if (usageStartMonthly <= usageThreshold) {

                                            log.debug({
                                                title: 'SWITCHing at Package: ' + package_text + ' - MONTHLY for Customer: ' + customer_text + ' -->',
                                                details: ctx.getRemainingUsage()
                                            });

                                            log.debug({
                                                title: 'test',
                                                details: ctx.deploymentId
                                            })


                                            var params = {
                                                custscript_prev_deploy_id: ctx.deploymentId
                                            }

                                            rescheduleMonthly = task.create({
                                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                scriptId: prevInvDeploy,
                                                deploymentId: adhocInvDeploy,
                                                params: params
                                            });
                                            
                                            rescheduleMonthly.submit();
                                            
                                            log.debug({
                                                title: 'rescheduleMonthly',
                                                details: rescheduleMonthly
                                            })

                                            if (rescheduleMonthly == false) {
                                                return false;
                                            }
                                        } else {
                                            var job_group_id = searchResult2.getValue('custrecord_job_group');


                                            var job_record = record.load({
                                                type: 'customrecord_job',
                                                id: searchResult2.getValue('internalid'),
                                            })

                                            job_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
                                            job_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_item });
                                            job_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
                                            job_record.setValue({ fieldId: 'custrecord_job_date_allocated', value: getDate() });

                                            job_record.save({
                                                enableSourcing: true,
                                                ignoreMandatoryFields: true
                                            })

                                            log.debug({
                                                title: 'PACKAGE MONTHLY - Allocator | Job ID: ' + searchResult2.getValue('internalid'),
                                                details: (usageStartMonthly - ctx.getRemainingUsage())
                                            })

                                            return true;
                                        }

                                    });

                                    log.debug({
                                        title: 'End of the Allocator search loop for Package: ' + package_text + ' - MONTHLY for Customer: ' + customer_text,
                                        details: ctx.getRemainingUsage()
                                    })
                                }

                                count_package++;

                                if (reschedulePerVisit == false || reschedulePerDay == false || rescheduleMonthly == false || rescheduleJobPackageAllocator == false) {
                                    return false;
                                } else {
                                    log.debug({
                                        title: 'Usage at the end of (' + count_package + ') Package: ' + package_text + ' for (' + count_customer + ') Customer: ' + customer_text,
                                        details: (usageStartPackage - ctx.getRemainingUsage())
                                    })

                                    return true;
                                }
                            } else {
                                return true;
                            }
                        });

                        if (reschedulePerVisit == false || reschedulePerDay == false || rescheduleMonthly == false || rescheduleJobPackageAllocator == false) {
                            return false;
                        } else {
                            log.debug({
                                title: 'End of the Package search loop ',
                                details: ctx.getRemainingUsage()
                            })

                            var searched_jobs2 = search.load({
                                id: 'customsearch_job_invoicing_allocator',
                                type: 'customrecord_job'
                            });



                            searched_jobs2.filters.push(search.createFilter({
                                name: 'custrecord_job_customer',
                                operator: search.Operator.IS,
                                values: customer_id,
                            }));

                            searched_jobs2.filters.push(search.createFilter({
                                name: 'custrecord_job_franchisee',
                                operator: search.Operator.IS,
                                values: customer_franchisee,
                            }));

                            

                            var resultSet2 = searched_jobs2.run();

                            var usageStartDateAllocated = ctx.getRemainingUsage();
                            var count_date_allocated_jobs = 0;

                            log.debug({
                                title: 'Start of Assigning Date Allocated Loop for Customer: ' + customer_text,
                                details: ctx.getRemainingUsage()
                            })

                            resultSet2.each(function(searchResult2) {

                                var usageStartPerDay = ctx.getRemainingUsage();

                                if (usageStartPerDay <= usageThreshold) {

                                    log.debug({
                                        title: 'SWITCHing at Assigning Date Allocated for Customer: ' + customer_text + ' -->',
                                        details: ctx.getRemainingUsage()
                                    })

                                    var params = {
                                        custscript_prev_deploy_id: ctx.deploymentId
                                    }

                                    rescheduleJobAllocator = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                        scriptId: prevInvDeploy,
                                        deploymentId: adhocInvDeploy,
                                        params: params
                                    });
                                    

                                    if (rescheduleJobAllocator == false) {
                                        return false;
                                    }
                                } else {
                                    var job_record = record.load({
                                        type: 'customrecord_job',
                                        id: searchResult2.getValue('internalid'),
                                    });
                                    

                                    job_record.setValue({ fieldId: 'custrecord_job_date_allocated', value: getDate() });

                                    job_record.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });

                                    count_date_allocated_jobs++;
                                    return true;
                                }
                            });

                            if (rescheduleJobAllocator == false) {
                                return false;
                            } else {
                                log.debug({
                                    title: 'Usage End of the Assigning Date Allocated Loop',
                                    details: 'For Customer:' + customer_text + '| No. of Jobs:' + count_date_allocated_jobs + ' | Usage' + (usageStartDateAllocated - ctx.getRemainingUsage())
                                })

                                count_customer++;

                                log.debug({
                                    title: 'Usage at the end of (' + count_customer + ') Customer: ' + customer_text,
                                    details: (usageStartCustomer - ctx.getRemainingUsage())
                                })

                                return true;
                            }
                        }
                    } else {
                        log.debug({
                            title: 'END --> Customer: ' + customer_id + ' present in Job - Invoicing Review - Invoiceable Discrepancies',
                            details: ctx.getRemainingUsage()
                        })

                        return true;
                    }
                } else {
                    return true;
                }
            });

            log.debug({
                title: 'End of the Customer allocator search loop ',
                details: ctx.getRemainingUsage()
            })

        }

        function getDate() {
            var date = new Date();
            if (date.getHours() > 6) {
                date.setHours(date.getHours() + 1);
            }        
            
            date = format.format({
                value: date,
                type: format.Type.DATE
            })
        
            return date;

        }

        /*
            To set the Package Status on each Job based on the combination.
            Expected Package Status				
                                        |Job Group Status|
            -----------------------------------------------------------------
            |Job Group Status|	Completed	Incomplete	Scheduled	Partial
            -----------------------------------------------------------------
            Completed			Completed	Partial		Partial		Partial
            Incomplete			Partial		Incomplete	Incomplete	Partial
            Scheduled			Partial		Incomplete	Scheduled	Partial
            Partial				Partial		Partial		Partial		Partial
            -----------------------------------------------------------------
        */
        function getPackageStatus(final_package_status, status) {

            if (final_package_status == null) {
                final_package_status = status;
            } else {
                if (final_package_status == status) {
                    final_package_status == status;
                } else if (final_package_status == 1 && (status == 2 || status == 3 || status == 4)) {
                    final_package_status == 2;
                } else if (final_package_status == 2 && (status == 1 || status == 3 || status == 4)) {
                    final_package_status == 2
                } else if (final_package_status == 3) {
                    if (status == 3 || status == 4) {
                        final_package_status = 4;
                    } else {
                        final_package_status = 2;
                    }
                } else if (final_package_status == 4) {
                    if (status == 1 || status == 2) {
                        final_package_status = 2;
                    } else {
                        final_package_status = 3;
                    }
                }
            }

            return final_package_status;
        }

        /*
            To get the Invoiceable Field set for the Jobs linked to the package
        */
        function getPackageInvoiceable(final_invoiceable, status, invoiceable) {

            if (invoiceable_check == false) {
                if (final_invoiceable == null) {
                    if (status == 1 && invoiceable == 2) {
                        final_invoiceable = 2;
                        invoiceable_check = true;
                        return final_invoiceable;
                    } else {
                        final_invoiceable = invoiceable;
                    }

                } else {
                    if (status == 1 && invoiceable == 2) {
                        final_invoiceable = 2;
                        invoiceable_check = true;
                        return final_invoiceable;
                    } else {
                        if (status == 1 && invoiceable == 1 && final_invoiceable == 1) {
                            final_invoiceable == 1;
                        } else if (status == 3 || status == 2 || status == 4) {
                            if (invoiceable == 1 && final_invoiceable == 1) {
                                final_invoiceable == 1;
                            } else if (invoiceable == 2 && final_invoiceable == 2) {
                                final_invoiceable == 2;
                            }

                        }
                    }
                }
            }

            return final_invoiceable;
        }

        /*
            Reschedule the Package Allcator Schedule Script
        */
        function rescheduleSC(usageStart) {

            if (usageStart <= usageThreshold) {

                log.debug({
                    title: 'SWITCHing -->',
                    details: ctx.getRemainingUsage()
                });

                var params = {
                    custscript_prev_deploy_id: ctx.deploymentId
                }

                var reschedule = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: prevInvDeploy,
                    deploymentId: adhocInvDeploy,
                    params: params
                });

                reschedule.submit();
                if (reschedule == false) {
                    return false;
                }
            }
        }

        function cleanArray(actual) {
            var newArray = new Array();
            for (var i = 0; i < actual.length; i++) {
                if (actual[i]) {
                    newArray.push(actual[i]);
                }
            }
            return newArray;
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }
        
        return {
            execute: main
        }
    }
);