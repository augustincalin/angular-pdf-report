using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Register controllers.  WithImplicitUsings enabled in the project file
// you don't need to explicitly import namespaces in each file.
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    // Optional: a permissive dev policy you can toggle
    options.AddPolicy("DevAll", p =>
        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});
// Uncomment the following lines to enable the Swagger UI for easier API testing during development
//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable Swagger in development only
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}
app.UseCors("DevAll");

app.UseHttpsRedirection();

app.UseRouting();

// Authorisation isn't configured for this sample but adding the
// middleware here makes it easy to wire in later.
app.UseAuthorization();

app.MapControllers();

app.Run();