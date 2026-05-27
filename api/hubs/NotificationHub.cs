using System.Security.Claims;
using api.common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace api.hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new HubException(ClientErrorMessages.UnauthorizedDetail);

            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId), Context.ConnectionAborted);
            await base.OnConnectedAsync();
        }

        public static string UserGroup(string userId) => $"notifications:user:{userId}";
    }
}
