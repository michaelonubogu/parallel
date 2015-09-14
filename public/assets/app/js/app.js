(function () {
    $(document).ready(function () {
        var faye_client = new Faye.Client(url);
        
        var cusElem = this;
        
        //Callback Email verification sent
        var faye_subscription = faye_client.subscribe('/verificationSent', function (message) {
            if (message && message.emailSent) {
                Materialize.toast('Verification Email Sent', 4000);
            }
        });
    })
});