using OpsIq.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpsIq.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace OpsIq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]

public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    // [HttpPost]
    // [Route("register")]
    // [AllowAnonymous]
    // public async Task<IActionResult> Register(RegisterDto registerDto)
    // {
    //     var user = new AppUser
    //     {
    //         UserName = registerDto.Email,
    //         Email = registerDto.Email,
    //     };
    //     var result = await _userManager.CreateAsync(user, registerDto.Password);
    //     if (!result.Succeeded)
    //     {
    //         return BadRequest("User registration failed.");
    //     }
    //     return Ok(user);
    // }

    [HttpPost]
    [Route("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        var user = await _signInManager.PasswordSignInAsync(loginDto.Email, loginDto.Password, isPersistent: false, lockoutOnFailure: false);
        if (!user.Succeeded)
        {
            return BadRequest("Invalid credentials.");
        }
        return Ok(user);
    }

    [HttpPost]
    [Route("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return NoContent();
    }
}