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
    var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }
        var role = runtime.getCurrentUser().role;

        /**
         * On page initialisation
         */
        function pageInit() {
            var currentScript = currentRecord.get();
            $(document).ready(function() {
                $('#daily_revenue').DataTable({
                    "scrollX": true
                })
            });

            var mainTable2 = document.getElementsByClassName("uir-inline-tag");

            var operator_id_string = currentScript.getValue({fieldId: 'operator_string'});

            var operator_id_array = operator_id_string.split(',');
            console.log('operator_id_array', operator_id_array);

            for (var i = 0; i < mainTable2.length; i++) {
                mainTable2[i].style.position = "absolute";
                //mainTable2[i].style.left = "10%";
                //mainTable2[i].style.right = "10%";
                mainTable2[i].style.maxWidth = "100%";
                mainTable2[i].style.top = "350px";
                if (operator_id_array.length <= 2) {
                    mainTable2[i].style.left = "25%";
                }
            }

            //CALCULATE THE TOTALS
            for (i = 0; i < operator_id_array.length; i++) {
                var total = getTotal(operator_id_array[i]);
                console.log('total', total);
                $('.total_service_count_' + operator_id_array[i] + '').text(total[0]);
                $('.total_extra_count_' + operator_id_array[i] + '').text(total[1]);
                $('.total_revenue_' + operator_id_array[i] + '').val(total[2]);
                $('.total_distribution_' + operator_id_array[i] + '').val(total[3]);
            }

            $('th.op, td.cell').css({
                "width": "400px",
                "display": "inline-block"
            });

        }

        function onclick_back() {
            var currentScript = currentRecord.get();

            var zee = parseInt(currentScript.getValue({fieldId: 'zee'}));
            var start_date = currentScript.getValue({fieldId: 'start_date'});
            var end_date = currentScript.getValue({fieldId: 'end_date'});
        
            var url = baseURL + "/app/site/hosting/scriptlet.nl?script=592&deploy=1";
            url += "&start_date=" + start_date + "&end_date=" + end_date + "&zee=" + zee;
            window.location.href = url;
        }

        /**
        * Get the total revenue and total service count for the operator given (sum all the rows of the tab)
        * @params {String} operator_name
        * @return {Array} - [total service count, total extra count, total revenue, total distribution]
        */
        function getTotal(operator_name) {
            var service_count_total = 0;
            var extra_count_total = 0;
            var revenue_total = 0.00;
            var distribution_total = 0.00;
            console.log('$(.service_count_+ operator_name +)', $('.service_count_' + operator_name + ''));
            $('.service_count_' + operator_name + '').each(function() {
                console.log('$(this).attr(value)', $(this).attr('value'));
                service_count_total += parseFloat($(this).attr('value'));
            });
            $('.extra_count_' + operator_name + '').each(function() {
                console.log('$(this).attr(value)', $(this).attr('value'));
                extra_count_total += parseFloat($(this).attr('value'));
            });
            $('.revenue_' + operator_name + '').each(function() {
                console.log('$(this).attr(value)', $(this).attr('value'));
                revenue_total += parseFloat($(this).attr('value'));
            });
            $('.distribution_' + operator_name + '').each(function() {
                console.log('$(this).attr(value)', $(this).attr('value'));
                distribution_total += parseFloat($(this).attr('value'));
            });
            return [parseInt(service_count_total), parseInt(extra_count_total), revenue_total.toFixed(2), distribution_total.toFixed(2)]
        }

        function saveRecord(context) {

            return true;
        }
        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            onclick_back: onclick_back
            
        };  
    }

    
);