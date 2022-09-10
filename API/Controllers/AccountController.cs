using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;
using API.Data;
using API.Dtos;
using API.Entities.Identity;
using API.Errors;
using API.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using MimeKit.Text;

namespace API.Controllers
{
    public class AccountController : BaseApiController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly DataContext _context;
        private readonly IConfiguration _config;

        public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, 
                                ITokenService tokenService, IEmailService emailService, DataContext context,
                                IConfiguration config)
        {
            _emailService = emailService;
            _tokenService = tokenService;
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _config = config;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var email = HttpContext.User?.Claims?.FirstOrDefault(x => x.Type == ClaimTypes.Email)?.Value;

            var user = await _userManager.FindByEmailAsync(email);

            return new UserDto
            {
                Email = user.Email,
                Token = _tokenService.CreateToken(user),
                DisplayName = user.DisplayName
            };
        }

        [HttpGet("emailexists")]
        public async Task<ActionResult<bool>> CheckEmailExistsAsync([FromQuery] string email)
        {
            return await _userManager.FindByEmailAsync(email) != null;
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null) return Unauthorized();

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (!result.Succeeded) return Unauthorized();

            if (!user.EmailConfirmed) return BadRequest("User not verified!");

            return new UserDto
            {
                Email = user.Email,
                Token = _tokenService.CreateToken(user),
                DisplayName = user.DisplayName
            };
        }

        [HttpPost("register")]
        public async Task<ActionResult> Register(RegisterDto registerDto)
        {
            if (CheckEmailExistsAsync(registerDto.Email).Result.Value)
            {
                return new BadRequestObjectResult(new ApiValidationErrorResponse
                    {Errors = new [] {"Email address already exists!"}});
            }

            var user = new AppUser
            {
                DisplayName = registerDto.DisplayName,
                Email = registerDto.Email,
                UserName = registerDto.Email,
                VerificationToken = CreateToken()
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded) return BadRequest("Failed to register user!");

            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_config.GetSection("EmailUsername").Value));
            email.To.Add(MailboxAddress.Parse(user.Email));
            email.Subject = "Thanks for joining MOBO!";
            email.Body = new TextPart(TextFormat.Html) { Text = "<h1>Paldies par reģistrāciju MOBO.LV</h1>" + "</br>" + "<a href='https://localhost:4200/verify/" + user.VerificationToken + "'>Apstiprināt Epasta adresi</a>" };

            var smtp = new SmtpClient();
            smtp.Connect(_config.GetSection("EmailHost").Value, 587, SecureSocketOptions.StartTls);
            smtp.Authenticate(_config.GetSection("EmailUsername").Value, _config.GetSection("EmailPassword").Value);
            smtp.Send(email);
            smtp.Disconnect(true);

            return Ok();
        }

        [HttpPost("verify")]
        public async Task<ActionResult> VerifyUser(string token)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);

            if (user == null) return BadRequest("Invalid token!");

            user.EmailConfirmed = true;

            user.VerificationToken = null;

            await _userManager.UpdateAsync(user);

            return Ok();
        }

        [HttpPost("forgotpassword")]
        public async Task<ActionResult> ForgotPassword(string userEmail)
        {
            var user = await _userManager.FindByEmailAsync(userEmail);

            if (user == null) return BadRequest("User not found!");

            user.PasswordResetToken = CreateToken();

            user.PasswordResetTokenExpireAt = DateTime.Now.AddDays(1);

            await _userManager.UpdateAsync(user);

            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_config.GetSection("EmailUsername").Value));
            email.To.Add(MailboxAddress.Parse(user.Email));
            email.Subject = "MOBO Password Recovery!";
            email.Body = new TextPart(TextFormat.Html) { Text = "<h1>Paroles maiņas pieprasijums.</h1>" + "</br>" + "<a href='https://localhost:4200/reset/" + user.PasswordResetToken + "'>Mainīt paroli!</a>" };

            var smtp = new SmtpClient();
            smtp.Connect(_config.GetSection("EmailHost").Value, 587, SecureSocketOptions.StartTls);
            smtp.Authenticate(_config.GetSection("EmailUsername").Value, _config.GetSection("EmailPassword").Value);
            smtp.Send(email);
            smtp.Disconnect(true);

            return Ok();
        }

        [HttpPost("resetpassword")]
        public async Task<ActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == resetPasswordDto.ResetToken);

            if (user == null || (user.PasswordResetTokenExpireAt < DateTime.Now
                    && user.PasswordResetTokenExpireAt.ToString() != new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified).ToString()))
            {
                return BadRequest("Invalid request!");
            }

            var newPassword = resetPasswordDto.Password;

            await _userManager.RemovePasswordAsync(user);//Remove current password

            await _userManager.AddPasswordAsync(user, newPassword);//Set new password
            
            return Ok();
        }

        //Generates token for verification and password reset
        private string CreateToken()
        {
            string token = Convert.ToHexString(RandomNumberGenerator.GetBytes(20));

            return token;
        }

    }
    
}