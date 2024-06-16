export function addOutputParams(argumentsManager){
    argumentsManager
        .addOption("--format", {
            dest: "outputFormat",
            description: "The output format. Either json (default) or csv"
        })
        .addOption(["-o", "--output_file"], {
            dest: "outputfile",
            description: "A file to save the output to. If not specified, the output will be sent to the std output."
        })
        .addSwitch(["-l", "--log-data"], {
            dest: "logdata",
            description: "Use to log the processed data (in a nice and pretty format) to the std output, the actual output is emitted"
        })
}