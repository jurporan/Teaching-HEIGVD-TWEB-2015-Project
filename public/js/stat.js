window.onload = function()
{
    var today = new Date();
    var nbDaysToSubstract = today.getDay() - 1;
    var monday = new Date(today.getTime() - nbDaysToSubstract * 24 * 60 * 60 * 1000);
    $.getJSON("/api/poll?since=" + monday.getUTCMonth() + "." + monday.getUTCDate() + "." + monday.getUTCFullYear(), loadStats);
}

function loadStats(data)
{
    $("#nbTotal").html(data.nb_open + data.nb_closed);
    $("#nbThisWeek").html(data.nb_open + data.nb_closed);
    $("#nbOpen").html(data.nb_recent);
}
