 /**
 * 
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * 
 * Description: 
 * @Last Modified by: Sruti Desai
 * 
 */

define(['N/error', 'N/runtime', 'N/search', 'N/url', 'N/record', 'N/format', 'N/email', 'N/currentRecord'],
    function(error, runtime, search, url, record, format, email, currentRecord) {
        var baseURL = 'https://1048144-sb3.app.netsuite.com';
        if (runtime.envType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }
        var role = runtime.getCurrentUser().role;
        var dates;
        /**
        * On page initialisation
        */
        var tableSet = [];
        function pageInit() {

            $("#NS_MENU_ID0-item0").css("background-color", "#CFE0CE");
            $("#NS_MENU_ID0-item0 a").css("background-color", "#CFE0CE");
            $("#body").css("background-color", "#CFE0CE");
            
            var currentScript = currentRecord.get();
            $(window).load(function() {
                // Animate loader off screen
                $(".se-pre-con").fadeOut("slow");;
            });

            $(document).on("change", ".zee_dropdown", function(e) {

                var zee = $(this).val();
                console.log(zee);
                var valueMonth = checkMonth();
                console.log(zee);
                dates = service_start_end_date(valueMonth);
                console.log(zee);
                currentScript.setValue({ fieldId: 'start_date', value: dates[0] });
                currentScript.setValue({ fieldId: 'end_date', value: dates[1] });
            
                console.log(zee);
            
                var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1203&deploy=1&compid=1048144&sorts[customername]=1";
                if (runtime.envType == "SANDBOX") {
                    var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1203&deploy=1&sorts[customername]=1";
                
                }
                url += "&start_date=" + dates[0] + "&end_date=" + dates[1] + "&zee=" + zee + "";
            
                window.location.href = url;
            });

            AddStyle('https://1048144.app.netsuite.com/core/media/media.nl?id=1988776&c=1048144&h=58352d0b4544df20b40f&_xt=.css', 'head');


            //JQuery to sort table based on click of header. Attached library  
            //   $(document).ready(function() {
            //       var datatable = $('#stockcount').DataTable();
            //       datatable.clear();
            //       datatable.rows.add('customername');
            //       datatable.draw();
            //       // $('.edit_customer').closest("tr").addClass("dynatable-complete");
            //       // $('.review_customer').closest("tr").addClass("dynatable-incomplete");

            //   });

            var mainTable = document.getElementsByClassName("uir-outside-fields-table");
            var mainTable2 = document.getElementsByClassName("uir-inline-tag");


            for (var i = 0; i < mainTable2.length; i++) {
                mainTable2[i].style.position = "absolute";
                mainTable2[i].style.left = "10%";
                mainTable2[i].style.width = "80%";
                mainTable2[i].style.top = "580px";
            }

            //$('.dynatable-sort-header').css("color", "white");
            $('.invoice_customer').css("font-weight", "bold");

            if (!isNullorEmpty(document.getElementById('tr_submitter'))) {
                document.getElementById('tr_submitter').style.display = 'none';
                $('#submitter').attr('disabled', 'disabled');

            }

            if (!isNullorEmpty(document.getElementById('tdbody_finalise'))) {
                document.getElementById('tdbody_finalise').style = 'background-color: #125ab2 !important;color: white;';
            }

            var result = finalise_date();

            if (result == true) {

            }
          
          

            // Get the header
            var header = document.getElementById("stockcount");

            // Get the offset position of the navbar
            var sticky = header.offsetTop;

            // When the user scrolls the page, execute myFunction 
            window.onscroll = function() {
                myFunction(header, sticky)
            };

            $(document).on('click', '.instruction_button', function(e) {

                var mainTable2 = document.getElementsByClassName("uir-inline-tag");
                for (var i = 0; i < mainTable2.length; i++) {
                    mainTable2[i].style.position = "absolute";
                    mainTable2[i].style.left = "10%";
                    mainTable2[i].style.width = "80%";
                    mainTable2[i].style.top = "860px";
                }
            
                //$('.admin_section').css("top", "500px");
                //$('.instruction_button').hide();
            });
          
            $("#results_table").css("padding-top", "350px");

            $('.collapse').on('shown.bs.collapse', function() {
                $("#results_table").css("padding-top", "640px");
                $(".admin_section").css("padding-top","300px");
            })
            
            $('.collapse').on('hide.bs.collapse', function() {
                $("#results_table").css("padding-top", "360px");
                $(".admin_section").css("padding-top","0px");
            })

          
            //onclickContinueReviewButton
            $( ".invoice_customer" ).click(function() {
                console.log("invoice cust btn clicked");
                console.log($(this).attr("onclick"));
                var fn = $(this).attr("value");
                var array = fn.split(';');
                console.log("fn", array);
                if (array.length == 3) {
                  onclickContinueReview(array[0], array[1], array[2]);
                } else if (array.length == 2) {
                  onclickContinueReview(array[0], array[1], '');
                } else {
                  onclickContinueReview('', '', '');
                }
                
           });

            /**
             * [description] - On change of Invoicing MOnth, page reloaded with the cosen month of jobs
             */
            $(document).on("change", ".invoicing_month", function(e) {
            
                var valueMonth = checkMonth();
                var zee = parseInt(currentScript.getValue({ fieldId: 'zee' }));
            
                if (valueMonth != false) {
            
                    /**
                     * [dates description] - To get the start/end date of the month
                     * @function service_start_end_date
                     * @return {array} returns the start/end date as an array. 0th position is the start date and 1st position is the end date.
                     */
                    dates = service_start_end_date(valueMonth);
            
                    currentScript.setValue({ fieldId: 'start_date', value: dates[0] });
                    currentScript.setValue({ fieldId: 'end_date', value: dates[1] });
            
                    var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1203&deploy=1&compid=1048144&sorts[customername]=1";
                    if (runtime.envType == "SANDBOX") {
                        var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1203&deploy=1&sorts[customername]=1";
                    }
            
                    url += "&start_date=" + dates[0] + "&end_date=" + dates[1] + "&zee=" + zee;
            
                    window.location.href = url;
                } else {
            
                    alert('Please select the invocing period');
                    $('.invoicing_month').focus();
                    return false;
                }
            });

            $(document).on('click', '#dailyrevenue', function(){
                var valueMonth = checkMonth();
                dates = service_start_end_date(valueMonth);
                var zee = parseInt(currentScript.getValue({ fieldId: 'zee' }));
            
                if (valueMonth != false) {
                    var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1200&deploy=1";
                    if (runtime.envType == "SANDBOX") {
                        var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1200&deploy=1";
                    }
            
                    url += "&start_date=" + dates[0] + "&end_date=" + dates[1] + "&zee=" + zee;
                    window.location.href = url;
                } else {
                    alert('Please select the invocing period');
                    $('.invoicing_month').focus();
                    return false;
                }
            });




        }

        function saveRecord(context) {

            var valueMonth = checkMonth();

            if (valueMonth != false) {
                return true;
            }
        }

        /**
         * [onclick_ContinueReview description] - On click of Start Review / Contine Review the next customer that has the invoiceable field as null is shown.
         * @param {string} internalID Customer internal ID
         */
        function onclickContinueReview(internalID, locked, sc_ID) {

            var currentScript = currentRecord.get();
            var valueMonth = checkMonth();
            console.log("test");
            if (valueMonth == false) {
                return false;
            } else {
                console.log('internalID', internalID);
                if (isNullorEmpty(internalID)) {
                    console.log('inside null internalID', internalID);
                    // var searchedJobsExtras = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_summary');
                    var searchedJobsExtras = search.load({
                        id: 'customsearch_job_inv_review_exp_amt',
                        type: 'customrecord_job'
                    });


                    searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_inv_finalised', join: null, operator: search.Operator.ISEMPTY }));
                    searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_reviewed', join: null, operator: search.Operator.ISEMPTY }));
                    searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_franchisee', join: null, operator: search.Operator.ANYOF, values: currentScript.getValue({fieldId: 'zee' }) }));
                    if (!isNullorEmpty(currentScript.getValue({fieldId: 'start_date' })) && !isNullorEmpty(currentScript.getValue({fieldId: 'end_date' }))) {
                        searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', join: null, operator: search.Operator.ONORAFTER, values: currentScript.getValue({fieldId: 'start_date' }) }));
                        searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', join: null, operator: search.Operator.ONORBEFORE, values: currentScript.getValue({fieldId: 'end_date' }) }));
                    }

                    var resultSetExtras = searchedJobsExtras.run();

                    var result = resultSetExtras.getRange({
                        start: 0,
                        end: 1
                    });

                    if (result.length != 0) {
                        var internalID = result[0].getValue({ name: 'internalid', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP });
                    }
                }
            }

            var output = url.resolveScript({
                deploymentId: 'customdeploy_sl_services_main_page_2',
                scriptId: 'customscript_sl_services_main_page_2',
            });
            var uploadURL = baseURL + output + '&customer_id=' + internalID + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&locked=' + locked + '&zee=' + parseInt(currentScript.getValue({ fieldId: 'zee' })) + '&sc=' + sc_ID;
            window.open(uploadURL, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        }

        function onclick_Finalise() {
            $('#submitter').prop('disabled', function(i, v) {
                return !v;
            });
            $('#submitter').trigger('click');
        }
      
        function finalise_date() {
        
            var date = new Date();
        
            var month = date.getMonth(); //Months 0 - 11
            var day = date.getDate();
            var year = date.getFullYear();
        
            if (day == 1 || day == 2 || day == 3 || day == 4 || day == 5) {
                if (month == 0) {
                    month = 11;
                    year = year - 1
                } else {
                    month = month - 1;
                }
            }
            var firstDay = new Date(year, (month), 1);
            var lastDay = new Date(year, (month + 1), 0);
        
            var service_range = [];
        
            
            service_range[0] = format.format({
                value: firstDay,
                type: format.Type.DATE
            });
            service_range[1] = format.format({
                value: lastDay,
                type: format.Type.DATE
            });
        
            return service_range;
        }

        // Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
        function myFunction(header, sticky) {
            if (window.pageYOffset >= sticky) {
                header.classList.add("sticky");
            } else {
                header.classList.remove("sticky");
            }
        }

        /**
         * [getDate description] - To get the current date
         * @return {string} returns the current date
         */
        function getDate() {
            var date = new Date();
            date = format.format({
                value: date,
                type: format.Type.DATE
            });
            return date;
        }

        /**
         * [checkMonth description] - To check if the Invoicing Period is selected
         * @return {boolean} true/false - If the Invoicing Period is not selected, it returns false
         */
        function checkMonth() {

            var valueMonth = $('.invoicing_month').val();

            if (isNullorEmpty(valueMonth)) {
                alert('Please select the invocing period');
                $('.invoicing_month').focus();
                return false;
            } else {
                return valueMonth;
            }

        }

        /**
         * [AddStyle description] - Add the CSS to the position specified in the page
         * @param {[type]} cssLink [description]
         * @param {[type]} pos     [description]
         */
        function AddStyle(cssLink, pos) {
            var tag = document.getElementsByTagName(pos)[0];
            var addLink = document.createElement('link');
            addLink.setAttribute('type', 'text/css');
            addLink.setAttribute('rel', 'stylesheet');
            addLink.setAttribute('href', cssLink);
            tag.appendChild(addLink);
        }

        /**
         * [service_start_end_date description] - To get the start and end date of the month
         * @param  {string} date_finalised Date string is passed as argument
         * @return {Array} returns array of the start and end date of the month
         */
        function service_start_end_date(date_finalised) {

            var split_date = date_finalised.split('-');


            var date = new Date();
            var firstDay = new Date(parseInt(split_date[0]), parseInt(split_date[1]) - 1, 1);
            var lastDay = new Date(parseInt(split_date[0]), split_date[1], 0);

            var service_range = [];

            service_range[0] = format.format({
                value: firstDay,
                type: format.Type.DATE
            });
            service_range[1] = format.format({
                value: lastDay,
                type: format.Type.DATE
            });

            return service_range;

        }
        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            onclick_Finalise: onclick_Finalise,
            onclickContinueReview: onclickContinueReview
            
        };  
    }

  
);