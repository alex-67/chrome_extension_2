function setDataInPie(men, women, unknown, currPostID) {
    var data = [
        {
            value: men,
            color: "#F7464A",
            highlight: "#FF5A5E",
            label: "Men"
        },
        {
            value: women,
            color: "#46BFBD",
            highlight: "#5AD3D1",
            label: "Women"
        },
        {
            value: unknown,
            color: "#FDB45C",
            highlight: "#FFC870",
            label: "Unknown"
        }
    ];
    if ((men != 0 || women != 0 || unknown != 0) && $('#' + currPostID).find("#myChart").length==0) {
        $('#' + currPostID + " .wall_post_text").nextAll().wrapAll('<tr><td colspan="2" ></td></tr>');
        $('#' + currPostID + " .wall_post_text").wrap("<td></td>");
        $('#' + currPostID).prepend('<td><canvas id="myChart" width="50" height="50"></canvas></td>');
        $('#' + currPostID + " > td").wrapAll("<tr></tr>");
        $('#' + currPostID).wrapInner('<table></table>');
         var ctx = $('#' + currPostID + " #myChart").get(0).getContext("2d");
        var myPieChart = new Chart(ctx).Pie(data, {
            tooltipFontSize: 7,
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",
            percentageInnerCutout: 50
        });
    }
}

chrome.runtime.onMessage.addListener(
  function (req, sender, sendResponse) {          
      if (req.mesType == "setChart")
        setDataInPie(req.men, req.women, req.unknown, req.currPostID);
  });
var sentIds=[];
function checkNewPosts() {
    var ids = [];
    $('._wall_post_cont').each(function () {
        if ($(this).find("#myChart").length == 0 && ids.indexOf($(this).attr('id')) == -1 && sentIds.indexOf($(this).attr('id')) == -1)
            ids.push($(this).attr('id'));
    });
    if (ids.length > 0) {
        Array.prototype.push.apply(sentIds, ids);
        chrome.runtime.sendMessage({ mesType: "giveIds", ids: JSON.stringify(ids) }, function (response) {
        });
    }
}
setInterval(checkNewPosts, 1500);

