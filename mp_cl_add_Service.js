 /**
 * 
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * 
 * Description: Client to add Services /Extras
 * @Last Modified by: Sruti Desai
 * 
 */

  define(['N/error', 'N/runtime', 'N/search', 'N/url', 'N/record', 'N/format', 'N/email', 'N/currentRecord'],
    function(error, runtime, search, url, record, format, email, currentRecord) {
        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }
        var role = runtime.getCurrentUser().role;

        /**
         * On page initialisation
         */
        
        
        var zee = 0;
        if (role == 1000) {
            //Franchisee
            zee = runtime.getCurrentUser();
        } else if (role == 3) { //Administrator
            zee = 6; //test
        } else if (role == 1032) { // System Support
            zee = 425904; //test-AR
        }
    
        var ctx = runtime.getCurrentScript();
        var package_name_create = new Array();
        var package_count_create = new Array();
        var item_array = new Array();
        var item_price_array = [];
        var package_count = 0;
        var item_count = 0;
        var item_price_count = 0;
        var package_create = true;
        
        /**
         * [pageInit description] - On Page initialization, form arrays to mnake sure that the duplication of the services/extras does not happen.
         */
        function pageInit() {
            var currentScript = currentRecord.get();

            var service_cat = currentScript.getValue({ fieldId: service_cat });

            if (service_cat == 1) {
                var searched_jobs = search.load({
                    id: 'customsearch_service_invoicing_add_srvc',
                    type: 'customrecord_service'
                });

            } else {
                var searched_jobs = search.load({
                    id: 'customsearch_service_invoicing_add_srv_2',
                    type: 'customrecord_service'
                });

            }

            searched_jobs.filters.push(search.createFilter({
                name: 'custrecord_service_customer',
                operator: search.Operator.IS,
                values: currentScript.getValue({ fieldId: customer }),
            }));

            if (service_cat != 1) {
                searched_jobs.filters.push(search.createFilter({
                    name: 'custrecord_service_package',
                    operator: search.Operator.ANYOF,
                    values: '@NONE@',
                }));

            }

            var resultSet = searched_jobs.run();

            //Create the item_price_array and package_name_create arrays based on the existing service records
            resultSet.each(function(searchResult) {

                var item_description = searchResult.getValue('custrecord_service_description');
                item_description = serviceDescription(item_description);

                if (item_price_array[searchResult.getValue('custrecord_service')] == undefined) {
                    item_price_array[searchResult.getValue('custrecord_service')] = [];
                    item_price_array[searchResult.getValue('custrecord_service')][0] = searchResult.getValue('custrecord_service_price') + '_' + item_description;
                } else {
                    var size = item_price_array[searchResult.getValue('custrecord_service')].length;
                    item_price_array[searchResult.getValue('custrecord_service')][size] = searchResult.getValue('custrecord_service_price') + '_' + item_description;
                }

                item_price_count++;
                return true;
            });

            
            for (y = 1; y <= currentScript.getLineCount({ sublistId: 'services' }); y++) {
                nlapiSetLineItemDisabled('services', 'itemprice', true, y);
            }
        }

        //Validate delete of service items. The service records are made inactive as requested by Will.
        function validateDelete(type) {
            if (type == 'new_services') {
                if (confirm("Are you sure you want to delete this item?\n\nThis action cannot be undone.")) {
                    

                    var item_name = currentScript.getCurrentSublistValue({ sublistId: type, fieldId: 'new_item' });
                    var item_package = currentScript.getCurrentSublistValue({ sublistId: type, fieldId: 'new_item_package' });
                    if (item_name == 17 && !isNullorEmpty(item_package)) {
                        discount_created[item_package] = 'F';
                    }
                    if (!isNullorEmpty(currentScript.getCurrentSublistValue({ sublistId: type, fieldId: 'new_service_record_internalid' }))) {

                        //Inactive the service record on remove

                        var service_record_id = currentScript.getCurrentSublistValue({ sublistId: type, fieldId: 'new_service_record_internalid' });

                        var service_record = record.load({
                            type: 'customrecord_service',
                            id: service_record_id,
                        });

                        service_record.setValue({ fieldId: 'isinactive', value: true });

                        service_record.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                    }
                    return true;
                } else {
                    return false;
                }
            }
        }

        
        /**
         * [clientFieldChanged description]
         * @param  {[type]} type    [description]
         * @param  {[type]} name    [description]
         * @param  {[type]} linenum [description]
         * @return {[type]}         [description]
         */
        function clientFieldChanged(type, name, linenum) {

            var currentScript = currentRecord.get();
            
            if (type == 'new_services') {
                var item_name = currentScript.getCurrentSublistValue({ sublistId: 'new_services', fieldId: 'new_item'});
                var item_price = currentScript.getCurrentSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice'});
                var item_desc = currentScript.getCurrentSublistValue({ sublistId: 'new_services', fieldId: 'new_description'});
                
                item_desc = serviceDescription(item_desc);

                if (name == 'new_item') {
                    var item_name = currentScript.getCurrentSublistValue({ sublistId: 'new_services', fieldId: 'new_item'});

                    if (item_name == 22) {
                        currentScript.setCurrentSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', value: 9});
                    }
                }
                if (name == 'new_itemprice') {

                    itemPriceArray(item_name, item_price, item_desc);

                }
                if (name == 'new_description' && !isNullorEmpty(currentScript.getCurrentSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice'}))) {

                    itemPriceArray(item_name, item_price, item_desc);
                }
            }

        }

        /**
         * [saveRecord description] - 
         */
        function saveRecord(context) {

            var currentScript = currentRecord.get();
            var customer = currentScript.getValue({ fieldId: 'customer' });
            var service_cat = currentScript.getValue({ fieldId: 'service_cat' });
            var start_date = currentScript.getValue({ fieldId: 'start_date' });
            var end_date = currentScript.getValue({ fieldId: 'end_date' });
            zee = currentScript.getValue({ fieldId: 'zee_id' });

            console.log(start_date)
            console.log(end_date)

            console.log(format.parse({ value: start_date, type: format.Type.DATE }));
            console.log(format.parse({ value: end_date, type: format.Type.DATE }));

            var recCustomer = record.load({
                type: record.Type.CUSTOMER,
                id: customer,
            });

            var franchisee = recCustomer.getValue({ fieldId: 'partner' });

            var commReg_search = search.load({
                id: 'customsearch_service_commreg_assign',
                type: 'customrecord_commencement_register'
            })

            var filterExpression = [
                ["custrecord_customer", "anyof", customer], // customer id
                "AND", ["custrecord_franchisee", "is", franchisee] // partner id
            ];

            commReg_search.filterExpression = filterExpression;

            var comm_reg_results = commReg_search.run();

            var count_commReg = 0;
            var commReg = null;

            comm_reg_results.each(function(searchResult) {
                count_commReg++;

                /**
                 * [if description] - Only the latest comm Reg needs to be assigned
                 */
                if (count_commReg == 1) {
                    commReg = searchResult.getValue('internalid');
                }

                /**
                 * [if description] - if more than one Comm Reg, error mail is sent
                 */
                if (count_commReg > 1) {
                    return false;
                }
                return true;
            });
            var extra_service_id = [];
            var extra_qty = [];
            var extra_rate = [];
            var delete_job_id = [];

            var new_jobs_service_id = [];
            var new_jobs_rate = [];
            var new_jobs_qty = [];
            var new_jobs_cat = [];
            var new_jobs_descp = [];

            var new_service_type = [];
            var new_service_name = [];
            var new_service_price = [];
            var new_service_descp = [];
            var new_service_qty = [];
            var new_service_customer = [];
            var new_service_comm_reg = [];
            var new_service_cat = [];

            for (y = 1; y <= currentScript.getLineCount({ sublistId: 'services' }); y++) {

                console.log(currentScript.getSublistValue({ sublistId: 'services', fieldId: 'service_record_internalid', line: y }))

                var params = [];
                params[params.length] = customer;
                params[params.length] = zee;
                params[params.length] = service_cat;

                if (currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y }) != currentScript.getSublistValue({ sublistId: 'services', fieldId: 'old_itemaddqty', line: y })) {

                    console.log('inside');

                    var item_list_value = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'item', line: y });
                    var package_name_stored = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'item_package', line: y });
                    var service_record_id = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'service_record_internalid', line: y });
                    var assign_package = false;


                    if (service_record_id != 242 && service_record_id != 243 && service_record_id != 1904 && service_record_id != 241) {

                        console.log('inside 2');

                        var service_type = record.load({
                            type: 'customrecord_service_type',
                            id: item_list_value,
                        });

                        var searched_jobs_extras = search.load({
                            id: 'customsearch_job_invoicing_jobs',
                            type: 'customrecord_job'
                        })

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_customer',
                            operator: search.Operator.IS,
                            values: customer
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_service',
                            operator: search.Operator.IS,
                            values: service_record_id
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_service_price',
                            operator: search.Operator.IS,
                            values: currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemprice', line: y })
                        }));                     

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_source',
                            operator: search.Operator.IS,
                            values: 5
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_date_scheduled',
                            operator: search.Operator.ONORAFTER,
                            values: start_date
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_date_scheduled',
                            operator: search.Operator.ONORBEFORE,
                            values: end_date
                        }));

                        var resultSet_extras = searched_jobs_extras.run();

                        var packageResult = resultSet_extrasResultSet.getRange({
                            start: 0,
                            end: 1
                        });

                        if (isNullorEmpty(packageResult)) {

                            console.log(123);
                            /**
                             * [if description] - If there is no job record present, create a job record with the details provided
                             */
                            if (currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y }) > 0) {
                                if (zee == franchisee) {
                                    params[params.length] = service_record_id;
                                    params[params.length] = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y });
                                    params[params.length] = null;
                                    params[params.length] = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemprice', line: y });

                                    createNewJobRecord(params);
                                } else {
                                    new_jobs_service_id[new_jobs_service_id.length] = service_record_id;
                                    new_jobs_rate[new_jobs_rate.length] = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemprice', line: y });
                                    new_jobs_qty[new_jobs_qty.length] = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y });
                                    new_jobs_cat[new_jobs_cat.length] = service_cat;
                                    new_jobs_descp[new_jobs_descp.length] = null;
                                }
                            }
                        } else {
                            if (packageResult.length == 1) {

                                console.log(233);
                                /**
                                 * [if description] - If the updated qty entered is greater than 0, update the job record
                                 */
                                if (currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y }) > 0) {
                                    resultSet_extras.each(function(searchResult_extras) {

                                        loadJobRecord(searchResult_extras.getValue('internalid'), currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y }), service_cat);
                                        return true;
                                    });
                                } else {
                                    /**
                                     * [description] - If the qty entered is 0, then add the job record id to the array to be deleted in the suitlet
                                     */
                                    resultSet_extras.each(function(searchResult_extras) {
                                        delete_job_id[delete_job_id.length] = searchResult_extras.getValue('internalid');
                                        return true;
                                    });
                                }
                            } else if (packageResult.length > 1) {
                                alert('More than One Service');
                                return false;
                            }
                        }
                    } else {

                        console.log('suitelet update');

                        extra_service_id[extra_service_id.length] = service_record_id;
                        extra_qty[extra_qty.length] = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemaddqty', line: y });
                        extra_rate[extra_rate.length] = currentScript.getSublistValue({ sublistId: 'services', fieldId: 'itemprice', line: y });
                    }
                }
            }

            var extra_service_string = extra_service_id.join();
            var extra_qty_string = extra_qty.join();
            var extra_rate_string = extra_rate.join();
            var delete_job_id_string = delete_job_id.join();

            currentScript.getValue({ fieldId: 'extra_service_string', value: extra_service_string });
            currentScript.getValue({ fieldId: 'extra_qty_string', value: extra_qty_string });
            currentScript.getValue({ fieldId: 'extra_rate_string', value: extra_rate_string });
            currentScript.getValue({ fieldId: 'delete_job_id_string', value: delete_job_id_string });

            
            for (y = 1; y <= currentScript.getLineCount({ sublistId: 'new_services' }); y++) {

                console.log('y' + y);

                var params = [];
                params[params.length] = customer;
                params[params.length] = zee;
                params[params.length] = service_cat;

                var item_list_value = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_item', line: y });
                var package_name_stored = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_item_package', line: y });
                var service_record_id = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_service_record_internalid', line: y });

                var assign_package = false;

                var service_type = record.load({
                    type: 'customrecord_service_type',
                    id: item_list_value,
                });

                var service_id = null;

                
                if (!isNullorEmpty(service_record_id) && (currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y }) == search.lookupFields({ type: 'customrecord_service', id: service_record_id, columns: 'custrecord_service_price' })) && (search.lookupFields({ type: 'customrecord_service', id: service_record_id, columns: 'custrecord_service_comm_reg' }) == commReg)) {
                    var new_service_record = record.load({
                        type: 'customrecord_service',
                        id: service_record_id,
                    })

                    new_service_record.setValue({ fieldId: 'custrecord_service', value: item_list_value });
                    new_service_record.setValue({ fieldId: 'name', value: service_type.getValue({fieldId: 'name'}) });
                    var service_rate = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y });
                    // if (item_list_value == 17) {
                    // 	service_rate = -service_rate;
                    // }

                    new_service_record.setValue({ fieldId: 'custrecord_service_price', value: service_rate });
                    new_service_record.setValue({ fieldId: 'custrecord_service_description', value: currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y }) });

                    if (!isNullorEmpty(commReg)) {
                        new_service_record.setValue({ fieldId: 'custrecord_service_comm_reg', value: commReg });

                    }

                    service_id = new_service_record.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    })

                    var searched_jobs_extras = search.load({
                        id: 'customsearch_job_invoicing_jobs',
                        type: 'customrecord_job'
                    })

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_customer',
                        operator: search.Operator.IS,
                        values: customer
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_service',
                        operator: search.Operator.IS,
                        values: service_id
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_service_price',
                        operator: search.Operator.IS,
                        values: currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y })
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_source',
                        operator: search.Operator.IS,
                        values: 5
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_date_scheduled',
                        operator: search.Operator.ONORAFTER,
                        values: start_date
                    }));

                    searched_jobs_extras.filters.push(search.createFilter({
                        name: 'custrecord_job_date_scheduled',
                        operator: search.Operator.ONORBEFORE,
                        values: end_date
                    }));

                    
                    var resultSet_extras = searched_jobs_extras.run();

                    var packageResult = resultSet_extrasResultSet.getRange({
                        start: 0,
                        end: 1
                    })

                    if (isNullorEmpty(packageResult)) {

                        if (currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y }) > 0) {

                            if (zee == franchisee) {
                                params[params.length] = service_id;
                                params[params.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y });
                                params[params.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y });
                                params[params.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y });


                                createNewJobRecord(params);

                                if (item_list_value == 22) {
                                    var custRecord = record.load({
                                        type: record.Type.CUSTOMER,
                                        id: customer,
                                    });

                                    custRecord.setValue({ fieldId: 'custentity_admin_fees', value: currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y }) });

                                    custRecord.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });

                                }
                            }
                        }


                    } else {
                        if (packageResult.length == 1) {
                            resultSet_extras.each(function(searchResult_extras) {

                                loadJobRecord(searchResult_extras.getValue('internalid'), currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y }), service_cat, currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y }));
                                return true;
                            });

                        } else if (packageResult.length > 1) {
                            alert('More than One Service');
                            return false;
                        }
                    }
                } else {
                    if (zee == franchisee) {
                        var new_service_record = record.create({
                            type: 'customrecord_service',
                            isDynamic: true,
                        })
                        
                        
                        new_service_record.setValue({ fieldId: 'custrecord_service', value: item_list_value });
                        new_service_record.setValue({ fieldId: 'name', value: service_type.getValue({ fieldId: 'name' }) });
                        var service_rate = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y });
                        // if (item_list_value == 17) {
                        // 	service_rate = -service_rate;
                        // }

                        new_service_record.setValue({ fieldId: 'custrecord_service_price', value: service_rate });
                        new_service_record.setValue({ fieldId: 'custrecord_service_description', value: currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y }) });
                        new_service_record.setValue({ fieldId: 'custrecord_service_customer', value: customer });
                        if (!isNullorEmpty(commReg)) {
                            new_service_record.setValue({ fieldId: 'custrecord_service_comm_reg', value: commReg });

                        }

                        service_id = new_service_record.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })

                        var searched_jobs_extras = search.load({
                            id: 'customsearch_job_invoicing_jobs',
                            type: 'customrecord_job'
                        });


                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_customer',
                            operator: search.Operator.IS,
                            values: customer
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_service',
                            operator: search.Operator.IS,
                            values: service_id
                        }));
                        
                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_service_price',
                            operator: search.Operator.IS,
                            values: currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y })
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_source',
                            operator: search.Operator.IS,
                            values: 5
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_date_scheduled',
                            operator: search.Operator.ONORAFTER,
                            values: start_date
                        }));

                        searched_jobs_extras.filters.push(search.createFilter({
                            name: 'custrecord_job_date_scheduled',
                            operator: search.Operator.ONORBEFORE,
                            values: end_date
                        }));

                        var resultSet_extras = searched_jobs_extras.run();

                        var packageResult = resultSet_extras.getRange({
                            start: 0,
                            end: 1
                        });

                        if (isNullorEmpty(packageResult)) {

                            if (currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y }) > 0) {

                                if (zee == franchisee) {
                                    params[params.length] = service_id;
                                    params[params.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y });
                                    params[params.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y });
                                    params[params.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y });


                                    createNewJobRecord(params);

                                    if (item_list_value == 22) {
                                        var custRecord = record.load({
                                            type: record.Type.CUSTOMER,
                                            id: customer,
                                        });

                                        custRecord.setValue({ fieldId: 'custentity_admin_fees', value: currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y })});

                                        custRecord.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });

                                    }
                                }
                            }


                        } else {
                            if (packageResult.length == 1) {
                                resultSet_extras.each(function(searchResult_extras) {

                                    loadJobRecord(searchResult_extras.getValue('internalid'), currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y }), service_cat, currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y }));
                                    return true;
                                });

                            } else if (packageResult.length > 1) {
                                alert('More than One Service');
                                return false;
                            }
                        }
                    } else {
                        new_service_price[new_service_price.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemprice', line: y });
                        new_service_descp[new_service_descp.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_description', line: y });
                        new_service_qty[new_service_qty.length] = currentScript.getSublistValue({ sublistId: 'new_services', fieldId: 'new_itemaddqty', line: y });
                        new_service_customer[new_service_customer.length] = customer;
                        new_service_type[new_service_type.length] = item_list_value;
                        new_service_name[new_service_name.length] = service_type.getValue({ fieldId: 'name' });
                        new_service_cat[new_service_cat.length] = service_cat;
                    }
                }
            }

            recCustomer.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            var new_jobs_service_id_string = new_jobs_service_id.join();
            var new_jobs_rate_string = new_jobs_rate.join();
            var new_jobs_qty_string = new_jobs_qty.join();
            var new_jobs_cat_string = new_jobs_cat.join();
            var new_jobs_descp_string = new_jobs_descp.join();



            var new_service_type_string = new_service_type.join();
            var new_service_name_string = new_service_name.join();
            var new_service_price_string = new_service_price.join();
            var new_service_cat_string = new_service_cat.join();
            var new_service_descp_string = new_service_descp.join();
            var new_service_customer_string = new_service_customer.join();
            var new_service_comm_reg_string = new_service_comm_reg.join();
            var new_service_qty_string = new_service_qty.join();


            currentScript.getValue({ fieldId: 'new_jobs_service_id_string', value: new_jobs_service_id_string });
            currentScript.getValue({ fieldId: 'new_jobs_rate_string', value: new_jobs_rate_string });
            currentScript.getValue({ fieldId: 'new_jobs_qty_string', value: new_jobs_qty_string });
            currentScript.getValue({ fieldId: 'new_jobs_cat_string', value: new_jobs_cat_string });
            currentScript.getValue({ fieldId: 'new_jobs_descp_string', value: new_jobs_descp_string });


            currentScript.getValue({ fieldId: 'new_service_type_string', value: new_service_type_string });
            currentScript.getValue({ fieldId: 'new_service_name_string', value: new_service_name_string });
            currentScript.getValue({ fieldId: 'new_service_price_string', value: new_service_price_string });
            currentScript.getValue({ fieldId: 'new_service_qty_string', value: new_service_qty_string });
            currentScript.getValue({ fieldId: 'new_service_customer_string', value: new_service_customer_string });
            currentScript.getValue({ fieldId: 'new_service_comm_reg_string', value: new_service_comm_reg_string });
            currentScript.getValue({ fieldId: 'new_service_descp_string', value: new_service_descp_string });
            currentScript.getValue({ fieldId: 'new_service_cat_string', value: new_service_cat_string });


            return true;
        }


        /**
         * [onclick_Back description] - Go back to the review page
         */
        function onclick_Back() {

            var currentScript = currentRecord.get();
            var internal_id = currentScript.getValue({ fieldId: 'customer' });
            console.log('zee', currentScript.getValue({ fieldId: 'zee_id' }));

            var output = url.resolveScript({
                deploymentId: 'customdeploy_sl_services_main_page',
                scriptId: 'customscript_sl_services_main_page',
            });
            var upload_url = baseURL + output + '&customer_id=' + internal_id + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");

        }
        
        /**
         * [createNewJobRecord description] -  create New Job Record
         * @param  {Array} params 0th position - customer id
         * @param  {Array} params 1th position - franchisee id
         * @param  {Array} params 2th position - category
         * @param  {Array} params 3th position - service id
         * @param  {Array} params 4th position - qty
         * @param  {Array} params 5th position - Description
         * @param  {Array} params 6th position - Price
         */
        function createNewJobRecord(params) {
            var job_new_record = record.create({
                type: 'customrecord_job',
                isDynamic: true,
            });


            console.log(params[0]);
            console.log(params[1]);

            job_new_record.setValue({ fieldId: 'custrecord_job_customer', value: params[0] });
            // job_new_record.setValue({ fieldId: 'custrecord_job_franchisee', value: params[1] });
            job_new_record.setValue({ fieldId: 'custrecord_job_service', value: params[3] });
            job_new_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: params[4] });
            job_new_record.setValue({ fieldId: 'custrecord_job_invoice_detail', value: params[5] });
            job_new_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
            job_new_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
            job_new_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
            job_new_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
            job_new_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: currentScript.getValue({fieldId: 'end_date'}) });
            if (params[2] == '1') {
                job_new_record.setValue({ fieldId: 'custrecord_job_group_status', value: 1 });
            }
            job_new_record.setValue({ fieldId: 'custrecord_job_service_category', value: params[2] });
            job_new_record.setValue({ fieldId: 'custrecord_job_service_price', value: params[6] });

            job_new_record.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        }

        /**
         * [loadJobRecord description]
         * @param  {String} jobId      Job Record ID
         * @param  {String} qty        Qty to be updated in the job record
         * @param  {String} serviceCat service category
         */
        function loadJobRecord(jobId, qty, serviceCat, description) {
            var job_record = record.load({
                type: 'customrecord_job',
                id: jobId,
            });

            job_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: qty });
            job_record.setValue({ fieldId: 'custrecord_job_invoice_detail', value: description });
            job_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
            job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
            job_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
            job_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
            job_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: currentScript.getValue({ fieldId: 'end_date' }) });
            if (serviceCat == '1') {
                job_record.setValue({ fieldId: 'custrecord_job_group_status', value: 1 });
            }
            job_record.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            
        }

        /**
         * [serviceDescription description] - Converts the description to lowercase / or makes the value 0 if the descriotion is null
         * @param  {String} description service description
         * @return {String}             
         */
        function serviceDescription(description) {
            if (isNullorEmpty(description)) {
                description = 0;
            } else {
                description = description.replace(/\s+/g, '-').toLowerCase()
            }

            return description;
        }

        /**
         * [itemPriceArray description] - Create the Item price array to check for duplicate services entered
         * @param  {String} item_name  Item name
         * @param  {String} item_price Item price
         * @param  {String} item_desc  Item description
         */
        function itemPriceArray(item_name, item_price, item_desc) {

            var currentScript = currentRecord.get();
            if (item_price_array[item_name] != undefined) {

                var size = item_price_array[item_name].length;

                for (var x = 0; x < size; x++) {

                    var price_desc = item_price_array[item_name][x];

                    price_desc = price_desc.split('_');

                    if (price_desc[0] == item_price && price_desc[1] == item_desc) {
                        alert('Duplicate Service with same price has been entered');
                        currentScript.cancelLine({ sublistId: 'new_services'});

                        return false;
                    }
                }

                item_price_array[item_name][x] = item_price + '_' + item_desc;

            } else {
                item_price_array[item_name] = [];
                item_price_array[item_name][0] = item_price + '_' + item_desc;
            }
        }
        
        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            
        };  
    }
  
      
  );